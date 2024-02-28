import Icon from '@mdi/react'
import Spinner from '../Spinner';
import EntityCard from './EntityCard';
import EntitySection from './EntitySection';
import WifiSelectionComponent from './WifiSelectionComponent';

import iif from '../../iif';
import css from '../css';
import isPrivateAddressSpace from '../../isPrivateAddressSpace';
import createAddHostURL from '../../createAddHostURL';

import { mdiWifiCheck, mdiWifiCog, mdiWifiCancel } from '@mdi/js';
import { useState } from 'react';

import { flex, flexFill } from '../utility.module.css';
import { link } from './ImprovWifi.module.css';

const ipAddressRegExp = /^https?:\/\/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(:[0-9]+)?$/;

export default function ImprovWifi({
  initializing,
  error,
  provisioning,
  initialized,
  nextUrl,
  scanning,
  provisioned,
  ssids,
  improv
}) {
  const [ isShowingWifiDialog, setShowWifiDialog] = useState(false);


  if (!initialized && !initializing) {
    return <>
        <Icon
          className={css(flex, flexFill)}
          path={mdiWifiCancel}
          size={4}
        />
        <h3 className={flex}>No Improv detected</h3>
    </>;
  }

  if (!initialized || provisioning) {
    return <Spinner className={css(flex, flexFill)} />;
  }

  if (isShowingWifiDialog) {
    return <WifiSelectionComponent
      scanning={scanning}
      ssids={ssids}
      onCancel={() => setShowWifiDialog(false)}
      onConnect={async (ssid, password) => {
        setShowWifiDialog(false);
        await improv.provision(ssid, password, 60000);
      }}
    />
  }

  const match = ipAddressRegExp.exec(nextUrl);
  const addViaWifi = (
      nextUrl.startsWith(location.href) ||
      (match && isPrivateAddressSpace(match[1]))
  );

  const visitUrl = match ? createAddHostURL(match[1]) : nextUrl;

  return <>
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
        href={visitUrl}
        target={iif(!addViaWifi, "_blank")}
      >
        <button>{iif(addViaWifi, 'Add via Wi-Fi', 'Visit device')}</button>
      </a>
    )}
  </>;
}
