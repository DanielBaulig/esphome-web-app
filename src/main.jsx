import EventSource from './FetchEventSource';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ControllerList from './ui/ControllerList.jsx';
import Header from './ui/Header.jsx';
import ControllerRegistry from './ControllerRegistry.js';

const registry = new ControllerRegistry();

import './main.css';

function sw() {
  if (import.meta.env.DEV) {
    return 'src/sw.js';
  } else {
    return '/sw.js';
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(sw(), { type: 'module' }).then((registration) => {
    console.log(`Registration succesful ${registration}`);
  });
} else console.warn('ServiceWorker not supported');

function getRegisteredHosts() {
  return registry.hosts;
}

function getRegisteredControllers() {
  return registry.hosts.map(host => registry.controllers[host]);
}

function registerHost(host) {
  registry.registerHost(host);
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
  reactRoot.render(
    <>
      <Header onAddController={() => promptAndRegisterHost()}/>
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
