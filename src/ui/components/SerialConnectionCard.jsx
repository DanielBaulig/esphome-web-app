import Icon from '@mdi/react'
import DrawerCard from './DrawerCard';
import Spinner from '../Spinner';
import EntityCard from './EntityCard';
import EntitySection from './EntitySection';
import WifiSelectionComponent from './WifiSelectionComponent';
import { ImprovSerial } from 'improv-wifi-serial-sdk/src/serial';

import betterSerial from '../../BetterSerialPorts';

import { mdiUsb, mdiCloseThick, mdiWifiCheck, mdiWifiCog, mdiWifiCancel  } from '@mdi/js';

import { fill, closeButton, flex } from './SerialConnectionCard.module.css';

import { useState, useReducer, useEffect, useRef, useCallback } from 'react';

import { title as appTitle } from '../../config';

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

function useBetterImprovSerial(port) {
  const improvRef = useRef(null);

  const [state, dispatch] = useReducer((state, action) => {
    switch(action.type) {
      case 'initialize_start':
        return {
          ...state,
          error: null,
          initializing: true,
        }
      case 'initialize_end': {
        const { name, info, chipFamily, firmware, version } = action.info;
        const { state: improvState, nextUrl } = improvRef.current;
        console.log('INIT', improvRef.current, action.info);
        return {
          ...state,
          name,
          chipFamily,
          firmware,
          version,
          provisioned: improvState === 4,
          nextUrl,
          initialized: true,
          initializing: false,
          notDetected: false,
        };
      }
      case 'scan_start':
        return { ...state, scanning: true, error: null }
      case 'scan_end':
        return { ...state, scanning: false, ssids: action.ssids }
      case 'provision_start':
        return { ...state, provisioning: true, error: null };
      case 'provision_end':
        return { ...state, provisioning: false, provisioned: true, nextUrl: action.nextUrl };
      case 'provision_failed':
        return { ...state, provisioning: false, provisioned: false, nextUrl: null, error: action.error };
      case 'disconnect':
        return { ...state };
      case 'initialize_failed':
        return {...state, notDetected: true, initializing: false };
    }
    throw new Error(`Invalid action ${action.type}`);
  }, {ssids: []});

  async function initialize() {
    function onErrorChange(event) {
      console.log('Improv error change', event)
    }
    function onStateChange(event) {
      console.log('Improv state change', event)
    }

    function onDisconnect() {
      cleanup();
      dispatch({ type: 'disconnect' });
    }

    function cleanup() {
      const improv = improvRef.current;
      if (!improv) {
        return;
      }
      improv.removeEventListener('disconnect', onDisconnect);
      improv.removeEventListener('state-changed', onStateChange);
      improv.removeEventListener('error-changed', onErrorChange);
      improvRef.current = null;
    }

    if (!port.opened) {
      await port.open({baudRate: 115200});
    }
    const improv = new ImprovSerial(port, console);
    improv.addEventListener('disconnect', onDisconnect, { once: true });
    improv.addEventListener('state-change', onStateChange);
    improv.addEventListener('error-change', onErrorChange);
    improvRef.current = improv;

    try {
      dispatch({ type: 'initialize_start' });
      const info = await improv.initialize();
      dispatch({ type: 'initialize_end', info });
    } catch(error) {
      cleanup();
      dispatch({ type: 'initialize_failed', error });
    }
  }

  return [state, {
    async initialize() {
      return initialize();
    },
    async close() {
      if (improvRef.current) {
        return improvRef.current.close();
      }
    },
    async scan() {
      if (!improvRef.current) {
        await initialize();
      }
      dispatch({ type: 'scan_start' });
      const ssids = await improvRef.current.scan();
      console.log('ssids', ssids);
      dispatch({ type: 'scan_end', ssids });
    },
    async provision(ssid, password, timeout) {
      if (!improvRef.current) {
        await initialize();
      }
      dispatch({ type: 'provision_start' });
      try {
        await improvRef.current.provision(ssid, password, timeout);
      } catch(error) {
        return dispatch({ type: 'provision_failed', error });
      }
      dispatch({ type: 'provision_end', nextUrl: improvRef.current.nextUrl });
    }
  }];
}

export default function SerialConnectionCard({port, onRemove}) {
  const state = useBetterSerialPort(port);
  const [ improvState, improv ] = useBetterImprovSerial(port);
  const [ wifiSelection, setWifiSelection] = useState(false);

  useEffect(() => {
    if (!port.opened) {
      port.open({baudRate: 115400});
    }
    return async () => {
      if (improv) {
        await improv.close();
      }
    };
  }, [port]);

  const { opened, connected, vendorId, productId } = state;
  const { initializing, error, provisioning, initialized, name, firmware, chipFamily, version, nextUrl, provisioned, notDetected, ssids } = improvState;

  let content = <Spinner />;
  if (initialized) {
    let wifiSection = <>
        <Icon className={`${flex} ${fill}`} size={4} path={provisioned ? mdiWifiCheck : mdiWifiCog} />
        {error && !provisioned && <h3 className={`${fill} ${flex}`}>Provisioning failed.</h3>}
        <button onClick={async () => {
          setWifiSelection(true);
          improv.scan();
        }}>{provisioned ? 'Change Wi-Fi' : 'Setup Wi-Fi'}</button>
        {nextUrl && <a className={flex} href={nextUrl} target="_blank"><button>Visit device</button></a>}
    </>;

    if (wifiSelection) {
      wifiSection = <WifiSelectionComponent
        ssids={ssids}
        onCancel={() => setWifiSelection(false)}
        onConnect={(ssid, password) => {
          improv.provision(ssid, password, 60000);
          setWifiSelection(false);
        }}
      />
    }

    if (provisioning) {
      wifiSection = <>
        <Spinner />
      </>;
    }

    content = <>
      <EntityCard title="Chip" className={flex}>
        <h3>{chipFamily}</h3>
      </EntityCard>
      <EntityCard title="Firmware" className={flex}>
        <h3>{firmware}</h3>
      </EntityCard>
      <EntityCard title="Version" className={flex}>
        <h3>{version}</h3>
      </EntityCard>
      <EntitySection title="Wi-Fi" className={flex}>
        {wifiSection}
      </EntitySection>
    </>;
  }
  if (notDetected && !initializing) {
    content =
      <EntitySection title="Wi-Fi" className={flex}>
        <Icon className={`${flex} ${fill}`} path={mdiWifiCancel} size={4}/>
        <h3 className={flex}>No Improv detected</h3>
      </EntitySection>
  }

  const title = name || (vendorId && productId && `usb-${vendorId}-${productId}`) || 'unidentified serial device';

  const menu = <button
    className={closeButton}
    onClick={() => port.forget()}
    tabIndex={0}
  >
    <Icon path={mdiCloseThick} size={0.8}/>
  </button>;

  return <DrawerCard
    title={title}
    glyph={<Icon size={0.8} path={mdiUsb} />}
    menu={menu}
    onBeginOpening={async () => {
      await improv.initialize();
    }}
    onDoneClosing={async () =>  {
      await improv.close();
    }}
  >
    {content}
  </DrawerCard>;
}
