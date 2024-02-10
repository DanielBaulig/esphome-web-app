import React from 'react';
import ReactDOM from 'react-dom/client';
import ControllerList from './ui/ControllerList.jsx';
import Header from './ui/Header.jsx';
import ControllerRegistry from './ControllerRegistry.js';
import Toast from './ui/Toast.jsx';

import { insecureOrigin } from './config';

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


registry.addEventListener('controllererror', (event) => {
  checkStrictMixedContent(event.detail.target.host);
  renderRoot();
});

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

function getRegisteredHosts() {
  return registry.hosts;
}

function getRegisteredControllers() {
  return registry.hosts.map(host => registry.controllers[host]);
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
    return false;
  }
}

// Let's montior for a PrivateNetworkAccess confirmation message
waitForPrivateNetworkAccessRequestConfirmation(null);

let hasStrictMixedContent;
async function checkStrictMixedContent(host) {
  if (!globalThis.isSecureContext) {
    return;
  }
  if (hasStrictMixedContent === undefined) {
    hasStrictMixedContent = !await waitForPrivateNetworkAccessRequestConfirmation(host);
  }
}

async function registerHost(host) {
  const controller = registry.registerHost(host);
  controller.connect();
  checkStrictMixedContent(host);
  renderRoot();
}

function removeHost(host) {
  registry.removeHost(host);
  renderRoot();
}

function promptAndRegisterHost() {
  const host = prompt('Host');
  if (host === null) {
    return;
  }
  registerHost(host);
}

function renderRoot() {
  let href = insecureOrigin;
  if (!href) {
    const url = new URL(location.href);
    url.protocol = 'http';
    href = url.href;
  }
  const strictMixedContentWarning = <Toast visible={hasStrictMixedContent}>
    This user agent appears to  not allow access to private network hosts from secure origins. Please try loading the <a href={href}>insecure origin</a> instead.
  </Toast>;
  reactRoot.render(
    <>
      <Header onAddController={() => promptAndRegisterHost()}/>
      {strictMixedContentWarning}
      <main>
        <ControllerList controllers={getRegisteredControllers()} onRemoveController={controller => removeHost(controller.host)} />
      </main>
    </>
  );
}

const reactRoot = ReactDOM.createRoot(
  document.body.appendChild(
    document.createElement('div')
  )
);

renderRoot();
