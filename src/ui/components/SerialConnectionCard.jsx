import Icon from '@mdi/react'
import DrawerCard from './DrawerCard';
import ImprovWifi from './ImprovWifi';
import FirmwareFlasher from './FirmwareFlasher';
import EntitySection from './EntitySection';
import EntityCard from './EntityCard';

import useImprovSerial from './useImprovSerial';
import iif from '../../iif';
import sleep from '../../sleep';

import { useReducer, useEffect, useState } from 'react';
import { title as appTitle } from '../../config';

import { mdiUsb, mdiCloseThick } from '@mdi/js';

import { closeButton } from './SerialConnectionCard.module.css';
import { flex, flexFill } from '../utility.module.css';

function useBetterSerialPort(port) {
  function initialize(port) {
    return {
      connected: port.connected,
      opened: port.opened,
    };
  }
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'open':
        const info = port.getInfo();
        return {
          ...state,
          connected: true,
          opened: true,
          vendorId: info.usbVendorId,
          productId: info.usbProductId,
        };
      case 'close':
        return {
          ...state,
          opened: false,
        };
      case 'initialize':
        return initialize(action.port);
      case 'disconnect':
        return {
          ...state,
          opened: false,
          connected: false,
        };
    }
  }, port, initialize);
  useEffect(() => {
    function onOpen() {
      dispatch({ type: 'open' });
    }
    function onClose() {
      dispatch({ type: 'close' });
    }
    function onDisconnect() {
      dispatch({ type: 'disconnect' });
    }

    port.addEventListener('open', onOpen);
    port.addEventListener('close', onClose);
    port.addEventListener('disconnect', onDisconnect);

    dispatch({ type: 'initialize', port });

    return () => {
      port.removeEventListener('open', onOpen);
      port.removeEventListener('close', onClose);
      port.removeEventListener('disconnect', onDisconnect);
    };
  }, [port]);

  return state;
}

export default function SerialConnectionCard({port, onRemove, open}) {
  const {
    opened,
    connected,
    vendorId,
    productId,
  } = useBetterSerialPort(port);
  const [ improvState, improv ] = useImprovSerial(port);
  const [ error, setError ] = useState(null);
  const { name, chipFamily, firmware, version } = improvState;

  useEffect(() => {
    (async () => {
      if (!port.opened && !open) {
        // If the port isn't open yet and the card won't render
        // opened anyway briefly open the port to read vendorId
        // and productId
        try {
          await port.open({baudRate: useImprovSerial.baudRate})
          await port.close();
        } catch(error) {
          console.error(error);
          setError(error);
        }
      }
    })();
    return async () => {
      if (port.opened) {
        await port.close();
      }
    };
  }, [port]);

  const title = name || (vendorId && productId && `usb-${vendorId}-${productId}`) || 'unidentified serial device';

  const menu = <button
    className={closeButton}
    onClick={() => port.forget()}
    tabIndex={0}
  >
    <Icon path={mdiCloseThick} size={0.8}/>
  </button>;

  let content = <>
    <EntityCard title="Firmware" className={flexFill}>
      {iif(chipFamily && firmware && version, <div className={flex}>
        {iif(chipFamily, <EntityCard title="Chip" className={flex}>
          <h3>{chipFamily}</h3>
        </EntityCard>)}
        {iif(firmware, <EntityCard title="Name" className={flex}>
          <h3>{firmware}</h3>
        </EntityCard>)}
        {iif(version, <EntityCard title="Version" className={flex}>
          <h3>{version}</h3>
        </EntityCard>)}
      </div>)}
        <FirmwareFlasher
          port={port}
          label={!!firmware ? 'Update Firmware' : 'Install Firmware'}
          onFirmwareUpdateDone={async () => {
          try {
            await improv.finger({ reset: true });
          } catch(error) {
            console.error(error);
            setError(error);
          }
        }}/>
    </EntityCard>
    <EntitySection title="Wi-Fi" className={flex}>
      <ImprovWifi {...improvState} improv={improv} />
    </EntitySection>
  </>;

  if (error) {
    content = <>
      <h3>⚠ Something went wrong.</h3>
    </>;
  }


  return <DrawerCard
    open={open}
    title={title}
    glyph={<Icon size={0.8} path={mdiUsb} />}
    menu={menu}
    onBeginOpening={async () => {
      try {
        await port.open({ baudRate: useImprovSerial.baudRate });
        await improv.finger();
      } catch(error) {
        console.error(error);
        setError(error);
      }
    }}
    onDoneClosing={async () =>  {
      if (port.opened) {
        await port.close();
      }
      setError(null);
    }}
  >
    {content}
  </DrawerCard>;
}
