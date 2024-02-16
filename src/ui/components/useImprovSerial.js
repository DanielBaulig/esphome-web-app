import { ImprovSerial } from 'improv-wifi-serial-sdk/src/serial';

import { useRef, useReducer } from 'react';

export default function useImprovSerial(port) {
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
        const { improvState, nextUrl, info } = action;
        return {
          ...state,
          ...info,
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
      case 'provision_end': {
        const { nextUrl } = action;
        return {
          ...state,
          nextUrl,
          provisioning: false,
          provisioned: true,
        };
      }
      case 'provision_failed': {
        const { error } = action;
        return {
          ...state,
          error,
          provisioning: false,
          provisioned: false,
          nextUrl: null,
        };
      }
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

    if (!port.writable || !port.readable) {
      await port.open({baudRate: useImprovSerial.baudRate});
    }
    const improv = new ImprovSerial(port, console);
    improv.addEventListener('disconnect', onDisconnect, { once: true });
    improv.addEventListener('state-change', onStateChange);
    improv.addEventListener('error-change', onErrorChange);
    improvRef.current = improv;

    try {
      dispatch({ type: 'initialize_start' });
      const info = await improv.initialize();
      dispatch({
        type: 'initialize_end',
        info,
        nextUrl: improv.nextUrl,
        improvState: improv.state
      });
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

useImprovSerial.baudRate = 115200;
