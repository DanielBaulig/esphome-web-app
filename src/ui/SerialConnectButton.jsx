import betterSerial from '../BetterSerialPorts';
import { useCallback, useReducer } from 'react';
import { active } from './SerialConnectButton.module.css';

export default function SerialConnectButton({ children, onConnectPort, ...props }) {
  const supportsSerial = !!betterSerial;

  if (!supportsSerial) {
    return null;
  }

  return <button
    {...props}
    onClick={async () => {
      const port = await betterSerial.requestPort()
      if (port) {
        onConnectPort(port);
      }
    }}
  >
    {children}
  </button>;
}
