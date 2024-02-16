import Icon from '@mdi/react'
import Spinner from '../Spinner';
import EntityCard from './EntityCard';
import EntitySection from './EntitySection';
import WifiSelectionComponent from './WifiSelectionComponent';

import iif from '../../iif';

import { mdiWifiCheck, mdiWifiCog, mdiWifiCancel } from '@mdi/js';
import { useState } from 'react';

import { fill, flex } from './Improv.module.css';

export default function Improv({
  initializing,
  error,
  provisioning,
  initialized,
  firmware,
  chipFamily,
  version,
  nextUrl,
  provisioned,
  notDetected,
  ssids,
  improv
}) {
  const [ isShowingWifiDialog, setShowWifiDialog] = useState(false);

  if (notDetected && !initializing) {
    return
      <EntitySection title="Wi-Fi" className={flex}>
        <Icon className={`${flex} ${fill}`} path={mdiWifiCancel} size={4}/>
        <h3 className={flex}>No Improv detected</h3>
      </EntitySection>
  }

  if (!initialized) {
    return <Spinner />;
  }

  let wifiSection = <>
    <Icon
      className={`${flex} ${fill}`}
      size={4}
      path={provisioned ? mdiWifiCheck : mdiWifiCog}
    />
    {iif(error && !provisioned,
      <h3 className={`${fill} ${flex}`}>Provisioning failed.</h3>
    )}
    <button
      onClick={() => {
        improv.scan();
        setShowWifiDialog(true);
      }}
    >
      {provisioned ? 'Change Wi-Fi' : 'Setup Wi-Fi'}
    </button>
    {iif(nextUrl,
      <a
        className={flex}
        href={nextUrl}
        target="_blank"
      >
        <button>Visit device</button>
      </a>
    )}
  </>;

  if (isShowingWifiDialog) {
    wifiSection = <WifiSelectionComponent
      ssids={ssids}
      onCancel={() => setShowWifiDialog(false)}
      onConnect={(ssid, password) => {
        improv.provision(ssid, password, 60000);
        setShowWifiDialog(false);
      }}
    />
  }

  if (provisioning) {
    wifiSection = <>
      <Spinner />
    </>;
  }

  return <>
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
