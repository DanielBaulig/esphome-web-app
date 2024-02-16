import betterSerial from '../BetterSerialPorts';
import { useCallback, useReducer } from 'react';
import { active } from './SerialConnectButton.module.css';

function useSerialPort(initialPort) {
  const disconnectHandler = useCallback(() => dispatch({ type: 'closed' }));
  const [state, dispatch] = useReducer((state, action) => {
    console.log('useReducer', action.type, action, state);
    function close() {
      console.log('close');
      (async () => {
        const { port } = state;
        if (!port) {
          return;
        }

        const close = (await port).close();
        close.then(() => {
          dispatch({ type: 'closed' });
        }, (error) => {
          dispatch({ type: 'closed' });
        });
      })();

      return { ...state };
    }

    function open() {
      console.log('open');
      if (state.port) {
        return { ...state };
      }

      const port = navigator.serial.requestPort();

      port.then((port) => {
        dispatch({ type: 'selected', port });
      }, (error) => {
        dispatch({ type: 'error', error });
      });

      return { ...state, port, error: null };
    }
    switch (action.type) {
      case 'toggle':
        if (state.port) {
          return close();
        } else {
          return open();
        }

      case 'open':
        return open();

      case 'close':
        return close();

      case 'selected': {
        const { port } = action;
        const baudRate = 115200;
        const connected = port.open({baudRate});

        connected.then(() => {
          dispatch({ type: 'opened' });
        }, (error) => {
          dispatch({ type: 'error', error });
        });

        return { ...state, port };
      }

      case 'opened': {
        const { port } = state;

        port.addEventListener(
          'disconnect',
          disconnectHandler
        );

        return { ...state, disconnectHandler };
      }

      case 'closed': {
        const { listener, port } = state;

        port.removeEventListener('disconnect', disconnectHandler);

        return { ...state, port: null, disconnectHandler: null };
      }

      case 'error': {
        const { error } = action;
        return { ...state, error, port: null };
      }
    }

    throw new Error('Invalid action in useSerialPort reducer');
  }, { port: initialPort }, (state) => {
    const { port } = state;
    if (!port) {
      return {};
    }
    if (port.then) {
      port.then(() => {
        dispatch({ type: 'opened' });
      }, (error) => {
        dispatch({ type: 'error', error });
      })
    }

    if (port.readable) {
      port.addEventListener('disconnect', disconnectHandler);

      return { ...state, disconnectHandler };
    }

    return {};
  });
  const actions = {
    open() {
      dispatch({ type: 'open' });
    },
    async close() {
      dispatch({ type: 'close' });
    },
    toggle() {
      dispatch({ type: 'toggle' });
    }
  };

  const { port } = state;
  const open = !!(port && port.readable);

  return [ {
      port: open && port,
    },
    actions
  ];
}

export default function SerialConnectButton({ onPortOpen, onPortClosed, children, className, ...props }) {
  // const [ { port }, { open, close, toggle } ] = useSerialPort();

  const supportsSerial = !!betterSerial;
  if (!supportsSerial) {
    return null;
  }

  return <button {...props} onClick={() => betterSerial.requestPort()} className={`${className}`}>
    {children}
  </button>;
}
