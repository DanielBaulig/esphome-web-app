import SerialConnectionCard from './SerialConnectionCard';
import betterSerial from '../../BetterSerialPorts';
import { useState, useEffect } from 'react';

const portKeys = new WeakMap();
let currentPortKey = 0;

function getPortKey(port) {
  let key = portKeys.get(port);
  if (key === undefined) {
    key = currentPortKey++;
    portKeys.set(port, key);
  }

  return key;
}

function useSerialPorts() {
  const serial = betterSerial;
  const [ports, setPorts] = useState([]);

  async function updatePorts() {
    const ports = await serial.getPorts()
    setPorts(ports);
  }

  useEffect(() => {
    updatePorts();
    serial.addEventListener('connect', () => {
      updatePorts();
    });
    serial.addEventListener('disconnect', () => {
      updatePorts();
    });

    return () => {
      serial.removeEventListener('connect', updatePorts);
      serial.removeEventListener('disconnect', updatePorts);
      setPorts([]);
    };
  }, []);

  return ports;
}

export default function SerialConnectionList() {
  const ports = useSerialPorts();

  return ports.map((port) => <SerialConnectionCard
    port={port}
    key={getPortKey(port)}
  />);
}
