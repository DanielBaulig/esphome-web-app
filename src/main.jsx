import React from 'react';
import ReactDOM from 'react-dom/client';
import ControllerList from './ui/ControllerList.jsx';
import Header from './ui/Header.jsx';
import ControllerRegistry from './ControllerRegistry.js';

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
        if (!timeout) {
          return;
        }
        cleanup();
        resolve();
      }
    }
    timeout = setTimeout(() => {
      cleanup();
      reject();
    }, ms);
    navigator.serviceWorker.addEventListener('message', handler);
  });
  return p;
}

async function waitForPrivateNetworkAccessRequestConfirmation() {
  try {
    await waitForMessage('pna_confirm', 1000);
    return true;
  } catch(e) {
    return false;
  }
}

let hasStrictMixedContent = null;

async function registerHost(host) {
  const controller = registry.registerHost(host);
  controller.connect();
  if (hasStrictMixedContent === null) {
    hasStrictMixedContent = !await waitForPrivateNetworkAccessRequestConfirmation(host);
  }
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
  let strictMixedContentWarning = null;
  if (hasStrictMixedContent) {
    const insecureOrigin = new URL(location.href);
    insecureOrigin.protocol = 'http';
    strictMixedContentWarning = <div>
      This user agent does not allow access to private network hosts from secure origins. Please try loading the <a href={insecureOrigin.href}>insecure origin</a> instead.
    </div>;
  }
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
