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

function ltrim(str, ch) {
  // Make sure ch is a single character
  ch = ch.charAt(0);
  const rx = new RegExp(`^[${ch}]*(.*)$`);
  return str.match(rx)[1];
}

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
    return receivedPrivateNetworkAccessConfirmation;
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

  async function checkStrictMixedContent() {
    if (!globalThis.isSecureContext) {
      return;
    }
    if (hasStrictMixedContent === undefined) {
      setHasStrictMixedContent(!await waitForPrivateNetworkAccessRequestConfirmation(1000));
    }
  }

  function interceptHashNavigation(event) {
    if (!event.hashChange) {
      return;
    }

    event.intercept({ handler() {
      executeHashQueryActions(event.destination.url);
    } });
  }

  function clearHash() {
    const url = new URL(location.href);
    url.hash = '';
    history.replaceState(null, '', url);
  }

  function executeAddHostHashAction(host) {
    if (!host) {
      return null;
    }

    if (controllerRegistry.has(host)) {
      return controllerRegistry.get(host).connect();
    }

    if(!confirm(`Would you like to add the host ${host}?`)) {
      return;
    }

    registerHost(host);
  }

  function executeHashQueryActions(str = location.href) {
    const url = new URL(str);
    const query = new URLSearchParams(ltrim(url.hash, '#'));

    for (const [k, v] of query) {
      if (k === 'addhost') {
        executeAddHostHashAction(v);
      }
    }

    clearHash();
  }

  async function registerHost(host) {
    const controller = controllerRegistry.registerHost(host);
    controller.connect();
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
      checkStrictMixedContent();
    }
    controllerRegistry.addEventListener('controllererror', onControllerError);
    
    return () => {
      controllerRegistry.removeEventListener('controllererror', onControllerError);
    };
  }, [controllerRegistry]);

  useEffect(() => {
    executeHashQueryActions();

    navigation.addEventListener('navigate', interceptHashNavigation);

    return () => {
      navigation.removeEventListener('navigate', interceptHashNavigation);
    };
  }, []);


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
          if (confirm(`Are you sure you want to remove the host ${controller.host}?`)) {
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
