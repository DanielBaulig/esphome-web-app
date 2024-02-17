import { ImprovSerial } from 'improv-wifi-serial-sdk/src/serial';

import { useRef, useReducer } from 'react';

export default function useImprovSerial(port) {
  const improvRef = useRef(null);

  const [state, dispatch] = useReducer((state, action) => {
    console.log(action.type);
    switch(action.type) {
      case 'reset': {
        return {
          ...state,
          initialized: false,
        };
      }
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
        };
      }
      case 'initialize_failed': {
        const { error } = action;
        return {
          ...state,
          initialized: false,
          initializing: false,
          error
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

    dispatch({ type: 'initialize_start' });
    try {
      if (!port.writable || !port.readable) {
        await port.open({baudRate: useImprovSerial.baudRate});
      }
      const improv = new ImprovSerial(port, console);
      improv.addEventListener('disconnect', onDisconnect, { once: true });
      improv.addEventListener('state-change', onStateChange);
      improv.addEventListener('error-change', onErrorChange);
      improvRef.current = improv;

      const info = await improv.initialize();
      dispatch({
        type: 'initialize_end',
        info,
        nextUrl: improv.nextUrl,
        improvState: improv.state
      });
    } catch(error) {
      console.error(error);
      cleanup();
      dispatch({ type: 'initialize_failed', error });
    }
  }

  async function withImprovInstance(fn) {
    const initialized = !!improvRef.current;
    if (!initialized) {
      console.log('initializing improv');
      await initialize();
    }
    try {
      console.log('executing withImprovInstance');
      return await fn();
    } finally {
      console.log('done');
      if (!initialized && improvRef.current) {
        console.log('cleaning up');
        await improvRef.current.close();
      }
    }
  }

  return [state, {
    async finger(options) {
      if (options?.reset) {
        dispatch({ type: 'reset' });
      }
      await withImprovInstance(async () => {});
    },
    async scan() {
      dispatch({ type: 'scan_start' });
      return withImprovInstance(async () => {
        const ssids = await improvRef.current.scan();
        dispatch({ type: 'scan_end', ssids });
      });
    },
    async provision(ssid, password, timeout) {
      dispatch({ type: 'provision_start' });
      return withImprovInstance(async () => {
        try {
          await improvRef.current.provision(ssid, password, timeout);
        } catch(error) {
          return dispatch({ type: 'provision_failed', error });
        }
        dispatch({
          type: 'provision_end',
          nextUrl: improvRef.current.nextUrl
        });
      });
    },
  }];
}

useImprovSerial.baudRate = 115200;
