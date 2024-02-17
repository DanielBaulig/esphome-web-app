import Drawer from '../Drawer';
import Spinner from '../Spinner';
import RadialProgress from '../RadialProgress';

import css from '../css';

import { flexFill } from '../utility.module.css';

import { useState, useEffect, useReducer, useRef } from 'react';
import iif from '../../iif';
import sleep from '../../sleep';

import {Transport, ESPLoader} from 'esptool-js';

function useEspTool(port) {
  const esptoolRef = useRef({});

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'file_reading_start':
        return {
          ...state,
          reading: true,
        };
      case 'file_reading_complete':
        return {
          ...state,
          reading: false,
        };
      case 'upload_start':
        return {
          ...state,
          progress: 0,
          uploading: true,
        };
      case 'upload_progress': {
        const { progress } = action;
        return {
          ...state,
          progress,
        };
      }
      case 'upload_complete':
        return {
          uploading: false,
          progress: 1,
        };
      case 'upload_fail': {
        const { error } = action;
        return {
          uploading: false,
          error,
        };
      }
      case 'flashing_start': {
        return {
          ...state,
          flashing: true,
          done: false,
          error: null,
        };
      }
      case 'flashing_complete': {
        return {
          ...state,
          flashing: false,
          done: true,
        };
      }
    }
    throw new Error(`Invalid action ${action.type}`);
  }, {});

  async function readFile(file) {
    dispatch({ type: 'file_reading_start' });
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      function onError() {
        cleanup();
        reject();
      }
      function onLoad(event) {
        cleanup();
        resolve(event.target.result);
      }
      function cleanup() {
        reader.removeEventListener('load', onLoad);
        reader.removeEventListener('error', onError);
      }

      reader.addEventListener('load', onLoad);
      reader.addEventListener('error', onError);

      reader.readAsBinaryString(file)
    });
  }

  async function resetTransport(transport) {
    // ESP Web Tools Install Button does this.
    // Not entirely sure why, the commit adding this doens't speak
    // to why this needs to happen, but I've been running into
    // issues whith not being able to talk to Improv after flashing
    // an MCU. So I'll see if this helps.
    await transport.device.setSignals({
      dataTerminalReady: false,
      requestToSend: true,
    });
    await sleep(250);
    await transport.device.setSignals({
      dataTerminalReady: false,
      requestToSend: false,
    });
    await sleep(250);
  }

  return [
    state, {
      async flash(file) {
        const transport = new Transport(port, false);

        try {
          dispatch({ type: 'flashing_start' });
          const loaderOptions  = {
            transport,
            baudrate: 115200,
            romBaudrate: 115200,
          };

          const loader =  new ESPLoader(loaderOptions);

          await loader.main();
          await loader.flashId();

          const data = await readFile(file);

          const flashOptions = {
            fileArray: [{data, address: 0}],
            flashSize: "keep",
            flashMode: "keep",
            flashFreq: "keep",
            eraseAll: false,
            compress: true,
            reportProgress: (index, written, total) => {
              dispatch({ type: 'upload_progress', progress: written/total});
            },
          };
          dispatch({ type: 'upload_start' });
          await loader.writeFlash(flashOptions);
          await resetTransport(transport);
          dispatch({ type: 'upload_complete' });
          dispatch({ type: 'flashing_complete' });
        } catch(error) {
          await resetTransport(transport);
          dispatch({ type: 'upload_fail', error });
          console.error(error);
        }
      },
    },
  ];
}

async function showFilePicker(accept) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('input');
    el.style = 'display: none;';
    el.type = 'file';
    el.accept = accept;
    document.body.appendChild(el);

    function cleanup() {
      el.removeEventListener('change', onChange);
      el.removeEventListener('cancel', cleanup);
      document.body.removeChild(el);
    }
    function onChange(event) {
      cleanup();
      const file = event.target.files[0];
      if (!file) {
        return resolve(null);
      }
      resolve(file);
    }

    function onCancel(event) {
      cleanup();
      resolve(null);
    }

    el.addEventListener('change', onChange);
    el.addEventListener('cancel', onCancel);

    el.click();
  });
}

const fileExtensions = '.bin,.img,.hex,.elf';

export default function FirmwareFlasher({port, onFirmwareUpdateDone, label}) {
  const [{flashing, progress, uploading, error, done}, esptool] = useEspTool(port);

  return <>
    {iif(uploading, <RadialProgress progress={progress} />)}
    {iif(flashing && !uploading, <Spinner />, )}
    {iif(error, <h3>⚠ Something went wrong.</h3>)}
    {iif(done, <h3>Installed.</h3>)}
    {iif(!flashing, <button className={flexFill} onClick={async () => {
      const file = await showFilePicker(fileExtensions);
      if (!file) {
        return;
      }
      if (port.opened) {
        // esptool.flash will open the port
        await port.close();
      }
      await esptool.flash(file);
      onFirmwareUpdateDone?.();
    }}>{label}</button>)}
  </>;
}
