import Icon from '@mdi/react';
import { mdiLock, mdiWifiStrength4, mdiWifiStrength3, mdiWifiStrength2, mdiWifiStrength1, mdiWifiStrengthOutline } from '@mdi/js';
import { useId, useState, useRef, useEffect } from 'react';
import iif from '../../iif';

import Drawer from '../Drawer';

import {row, list, radio, insecure, password as passwordClass, drawer, main } from './WifiSelectionComponent.module.css';

function getRssiIcon(rssi) {
  if (rssi >= -55) {
    return mdiWifiStrength4;
  }
  if (rssi >= -66) {
    // Three
    return mdiWifiStrength3;
  }
  if (rssi >= -77) {
    // Two
    return mdiWifiStrength2;
  }
  if (rssi >= -88) {
    // One
    return mdiWifiStrength1;
  }

  return mdiWifiStrengthOutline;
}

function WifiSelectionRow({name, rssi, secured, radioGroup, onSelected}) {
  const id = useId();
  const iconSize = 0.8;
  return <>
    <input
      id={id}
      name={radioGroup}
      type="radio"
      className={radio}
      onChange={e => {
        e.target.parentElement.scrollIntoView({block: 'nearest'});
        onSelected({name, rssi, secured});
      }}
    />
    <label className={`${row} ${iif(!secured, insecure)}`} htmlFor={id}>
      <span className={name}>{name}</span>
      {iif(secured, <Icon path={mdiLock} size={iconSize} />)}
      <Icon path={getRssiIcon(rssi)} size={iconSize} />
    </label>
  </>;
}

export default function WifiSelectionComponent({ssids, onCancel, onConnect}) {
  const passwordRef = useRef(null);
  const [password, setPassword] = useState('');
  const [promptPassword, setPromptPassword] = useState(false);
  const [ssid, setSsid] = useState(null);
  const id = useId();

  return <>
    <div className={main}>
      <ul className={list}>{ssids.sort((one, two) => two.rssi - one.rssi).map(
        (ssid, idx) => <li key={idx}>
          <WifiSelectionRow radioGroup={id} name={ssid.name} rssi={ssid.rssi} secured={ssid.secured} onSelected={() => setSsid(ssid)} />
        </li>
      )}</ul>
      <Drawer
        open={promptPassword}
        className={drawer}
        onDoneOpening={() => passwordRef.current.focus()}
      >
        <input
          type="password"
          className={passwordClass}
          ref={passwordRef}
          placeholder="Enter Wi-Fi password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Drawer>
    </div>
    <button
      disabled={!ssid || (promptPassword && !password)}
      onClick={() => {
        if (!promptPassword && ssid.secured) {
          setPassword('');
          setPromptPassword(true);
        } else {
          onConnect(ssid.name, passwordRef.current?.value);
        }
      }}
    >
      Connect
    </button>
    <button onClick={() => {
      if (promptPassword) {
        setPromptPassword(false);
      } else {
        onCancel();
      }
    }}>Cancel</button>
  </>

}
