import { ESPHomeWebController } from 'esphome-web';
import FetchEventSource from './FetchEventSource';

function curry(C, arg) {
  return function(...args) {
    args.push(arg);
    return new C(...args);
  }
}

export default class ControllerRegistry extends EventTarget {
  #fetch;

  constructor(storageKey = "controllers", {fetch} = {}) {
    super();
    this.storageKey = storageKey;
    this.#fetch = fetch;
    const json = JSON.parse(localStorage.getItem(storageKey));
    this.hosts = json || [];
    this.#constructControllers();
  }

  has(host) {
    return this.hosts.includes(host);
  }

  get(host) {
    return this.controllers[host];
  }

  #onControllerError = (event) => {
    this.dispatchEvent(new CustomEvent('controllererror', {detail: event}));
  }

  #destroyController(host) {
    const controller = this.controllers[host];
    controller.removeEventListener('error', this.#onControllerError);
    controller.destroy();
  }

  #createController(host) {
    const controller = new ESPHomeWebController(host, {
      fetch: this.#fetch, 
      EventSource: curry(FetchEventSource, {fetch: this.#fetch})
    });

    controller.addEventListener('error', this.#onControllerError);

    return controller;
  }

  #constructControllers() {
    if (!this.controllers) {
      this.controllers = {};
    }
    this.hosts.forEach(host => {
      if (!(host in this.controllers)) {
        this.controllers[host] = this.#createController(host);
      }
    });
  }

  #flush() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.hosts));
  }

  addHost(host) {
    if (this.has(host)) {
      return this.controllers[host];
    }
    this.hosts.push(host);
    this.controllers[host] = this.#createController(host);
    this.#flush();
    return this.controllers[host];
  }

  insertHost(host, controller) {
    const hostIndex = this.hosts.indexOf(host);
    // Check if we alredy have this host
    if (hostIndex > -1) {
      // Remove host from current position if so
      this.hosts.splice(hostIndex, 1);
    }

    // Check if a controller was given to insert before and we can find it's position
    const insertIndex = controller ? this.hosts.indexOf(controller.host) : -1;
    if (insertIndex > -1) {
      // Insert host before given controller if so
      this.hosts.splice(insertIndex, 0, host);
    } else {
      // Otherwise append at end
      this.hosts.push(host);
    }

    // Check if we already have a controller for this host
    if (!this.controllers[host]) {
      // Create one if not
      this.controller[host] = this.#createController(host);
    }

    this.#flush();

    return this.controllers[host];
  }

  removeHost(host) {
    if (!this.has(host)) {
      return;
    }
    this.hosts = this.hosts.filter(v => v != host);
    this.#destroyController(host);
    delete this.controllers[host];
    this.#flush();
  }
}
