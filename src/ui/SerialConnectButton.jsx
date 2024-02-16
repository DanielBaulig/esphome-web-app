import betterSerial from '../BetterSerialPorts';
import { useCallback, useReducer } from 'react';
import { active } from './SerialConnectButton.module.css';

export default function SerialConnectButton({ onPortOpen, onPortClosed, children, className, ...props }) {
  const supportsSerial = !!betterSerial;

  if (!supportsSerial) {
    return null;
  }

  return <button {...props} onClick={() => betterSerial.requestPort()} className={`${className}`}>
    {children}
  </button>;
}
