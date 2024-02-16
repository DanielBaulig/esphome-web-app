import Icon from '@mdi/react'
import Spinner from '../Spinner';
import EntityCard from './EntityCard';
import EntitySection from './EntitySection';
import WifiSelectionComponent from './WifiSelectionComponent';

import iif from '../../iif';
import css from '../css';

import { mdiWifiCheck, mdiWifiCog, mdiWifiCancel } from '@mdi/js';
import { useState } from 'react';

import { flex, flexFill } from '../utility.module.css';
import { link } from './Improv.module.css';

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
  ssids,
  improv
}) {
  const [ isShowingWifiDialog, setShowWifiDialog] = useState(false);


  if (!initialized && !initializing) {
    return (
      <EntitySection title="Wi-Fi" className={flex}>
        <Icon className={css(flex, flexFill)} path={mdiWifiCancel} size={4}/>
        <h3 className={flex}>No Improv detected</h3>
      </EntitySection>
    );
  }

  if (!initialized) {
    return <Spinner className={css(flex, flexFill)} />;
  }

  let wifiSection = <>
    <Icon
      className={css(flex, flexFill)}
      size={4}
      path={provisioned ? mdiWifiCheck : mdiWifiCog}
    />
    {iif(error && !provisioned,
      <h3 className={css(flex, flexFill)}>Provisioning failed.</h3>
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
        className={css(link, flex)}
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
