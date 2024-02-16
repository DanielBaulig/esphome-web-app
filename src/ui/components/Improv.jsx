import Icon from '@mdi/react'
import Spinner from '../Spinner';
import EntityCard from './EntityCard';
import EntitySection from './EntitySection';
import WifiSelectionComponent from './WifiSelectionComponent';

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
  const [ wifiSelection, setWifiSelection] = useState(false);

  let content = <Spinner />;
  if (initialized) {
    let wifiSection = <>
        <Icon className={`${flex} ${fill}`} size={4} path={provisioned ? mdiWifiCheck : mdiWifiCog} />
        {error && !provisioned && <h3 className={`${fill} ${flex}`}>Provisioning failed.</h3>}
        <button onClick={async () => {
          setWifiSelection(true);
          improv.scan();
        }}>{provisioned ? 'Change Wi-Fi' : 'Setup Wi-Fi'}</button>
        {nextUrl && <a className={flex} href={nextUrl} target="_blank"><button>Visit device</button></a>}
    </>;

    if (wifiSelection) {
      wifiSection = <WifiSelectionComponent
        ssids={ssids}
        onCancel={() => setWifiSelection(false)}
        onConnect={(ssid, password) => {
          improv.provision(ssid, password, 60000);
          setWifiSelection(false);
        }}
      />
    }

    if (provisioning) {
      wifiSection = <>
        <Spinner />
      </>;
    }

    content = <>
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
  if (notDetected && !initializing) {
    content =
      <EntitySection title="Wi-Fi" className={flex}>
        <Icon className={`${flex} ${fill}`} path={mdiWifiCancel} size={4}/>
        <h3 className={flex}>No Improv detected</h3>
      </EntitySection>
  }

  return content;
}
