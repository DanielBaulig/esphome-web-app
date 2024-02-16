import SerialConnectionCard from './SerialConnectionCard';
import betterSerial from '../../BetterSerialPorts';
import { useState, useEffect } from 'react';

import { list } from './SerialConnectionList.module.css';

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

  if (!serial) {
    return [];
  }

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

export default function SerialConnectionList({showPort}) {
  const ports = useSerialPorts();

  if (!ports.length) {
    return null;
  }

  console.log(showPort, ports);

  return <div className={list}>
    {ports.map((port) => <SerialConnectionCard
      port={port}
      open={showPort === port}
      key={getPortKey(port)}
    />)}
  </div>;
}
