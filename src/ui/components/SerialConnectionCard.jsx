import Icon from '@mdi/react'
import DrawerCard from './DrawerCard';
import Improv from './Improv';

import useImprovSerial from './useImprovSerial';

import { useReducer, useEffect } from 'react';
import { title as appTitle } from '../../config';

import { mdiUsb, mdiCloseThick } from '@mdi/js';

import { closeButton } from './SerialConnectionCard.module.css';

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
  const { name } = improvState;

  useEffect(() => {
    (async () => {
      if (!port.opened && !open) {
        // If the port isn't open yet and the card won't render
        // opened anyway briefly open the port to read vendorId
        // and productId
        await port.open({baudRate: useImprovSerial.baudRate})
        await port.close();
      }
    })();
    return async () => {
      await improv.close();
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

  return <DrawerCard
    open={open}
    title={title}
    glyph={<Icon size={0.8} path={mdiUsb} />}
    menu={menu}
    onBeginOpening={() => improv.initialize()}
    onDoneClosing={async () =>  {
      await improv.close();
      if (port.opened) {
        await port.close();
      }
    }}
  >
    <Improv {...improvState} improv={improv} />
  </DrawerCard>;
}
