import React from 'react';
import ReactDOM from 'react-dom/client';
import ControllerList from './ui/components/ControllerList.jsx';
import SerialConnectionList from './ui/components/SerialConnectionList.jsx';
import Header from './ui/Header.jsx';
import ControllerRegistry from './ControllerRegistry.js';
import Toast from './ui/Toast.jsx';

import { useState, useEffect } from 'react';

import { title, insecureOrigin } from './config';
import { footer } from './main.module.css';

function privateAddressSpaceFetch(...args) {
  const isInsecureTarget = args[0].toString().startsWith('http:');
  const usePrivateAddressSpace = globalThis.isSecureContext && isInsecureTarget;
  if (usePrivateAddressSpace) {
    if (args.length < 2) {
      args.push({});
    }
    Object.assign(args[1], {
      targetAddressSpace: 'private',
    });
  }

  return fetch(...args);
}

const registry = new ControllerRegistry('controllers', {fetch: privateAddressSpaceFetch});

import './main.css';
import 'virtual:custom.css';

function sw() {
  if (import.meta.env.DEV) {
    return 'src/sw.js';
  } else {
    return '/sw.js';
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(sw(), { scope: '/', type: 'module' }).then((registration) => {
    console.log(`Registration succesful ${registration}`);
  });
} else console.warn('ServiceWorker not supported');

async function waitForMessage(message, ms) {
  const p = new Promise((resolve, reject) => {
    let timeout;
    function cleanup() {
      clearTimeout(timeout);
      timeout = 0;
      navigator.serviceWorker.removeEventListener('message', handler);
    }
    function handler(event) {
      if (event.data === message) {
        if (ms !== null && !timeout) {
          return;
        }
        cleanup();
        resolve();
      }
    }
    if (ms !== null) {
      timeout = setTimeout(() => {
        cleanup();
        reject();
      }, ms);
    }
    navigator.serviceWorker.addEventListener('message', handler);
  });
  return p;
}

let receivedPrivateNetworkAccessConfirmation = false;
async function waitForPrivateNetworkAccessRequestConfirmation(ms = 1000) {
  if (receivedPrivateNetworkAccessConfirmation) {
    return true;
  }
  try {
    await waitForMessage('pna_confirm', ms);
    return receivedPrivateNetworkAccessConfirmation = true;
  } catch(e) {
    return false;
  }
}

// Let's montior for a PrivateNetworkAccess confirmation message
waitForPrivateNetworkAccessRequestConfirmation(null);

function App({controllerRegistry}) {
  const [mostRecentPort, setMostRecentPort] = useState(null);
  const [controllers, setControllers] = useState(getRegisteredControllers());
  const [hasStrictMixedContent, setHasStrictMixedContent] = useState(undefined);

  function getRegisteredControllers() {
    return controllerRegistry.hosts.map(host => registry.controllers[host]);
  }

  async function checkStrictMixedContent(host) {
    if (!globalThis.isSecureContext) {
      return;
    }
    if (hasStrictMixedContent === undefined) {
      setHasStrictMixedContent(!await waitForPrivateNetworkAccessRequestConfirmation(host));
    }
  }

  async function registerHost(host) {
    const controller = controllerRegistry.registerHost(host);
    controller.connect();
    checkStrictMixedContent(host);
    setControllers(getRegisteredControllers());
  }

  function removeHost(host) {
    controllerRegistry.removeHost(host);
    setControllers(getRegisteredControllers());
  }

  function promptAndRegisterHost() {
    const host = prompt('Host');
    if (host === null) {
      return;
    }
    registerHost(host);
  }

  useEffect(() => {
    function onControllerError(event) {
      checkStrictMixedContent(event.detail.target.host);
    }
    controllerRegistry.addEventListener('controllererror', onControllerError);
    return () => {
      controllerRegistry.removeEventListener('controllererror', onControllerError);
    };
  }, [controllerRegistry]);


  let href = insecureOrigin;
  if (!href) {
    const url = new URL(location.href);
    url.protocol = 'http';
    href = url.href;
  }

  const strictMixedContentWarning = <Toast style="warning" visible={hasStrictMixedContent}>
    This user agent appears to  not allow access to private network hosts from secure origins. Please try loading the <a href={href}>insecure origin</a> instead.
  </Toast>;

  return <>
    <Header
      onAddController={() => promptAndRegisterHost()}
      onConnectSerialPort={(port) => setMostRecentPort(port)}
    />
    {strictMixedContentWarning}
    <main>
      <SerialConnectionList
        showPort={mostRecentPort}
      />
      <ControllerList
        controllers={controllers}
        onRemoveController={controller => {
          if (confirm('Are you sure you want to remove this controller?')) {
            removeHost(controller.host) ;
          }
        }}
      />
    </main>
    <div className={footer}><a href="https://github.com/DanielBaulig/esphome-web-app/" target="_blank">{title} is Open Source</a><div>{__COMMIT_HASH__ ? `Commit ${__COMMIT_HASH__}` : ''}</div></div>
  </>;
}

function renderRoot() {
  reactRoot.render(
    <App controllerRegistry={registry} />
  );
}


const reactRoot = ReactDOM.createRoot((root =>
  document.body.replaceChildren(root) || root
)(document.createElement('div')));

renderRoot();
