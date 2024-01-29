import { ESPHomeWebController } from 'esphome-web';
import FetchEventSource from './FetchEventSource';

function curry(C, arg) {
  return function(...args) {
    args.push(arg);
    return new C(...args);
  }
}

export default class ControllerRegistry {
  #fetch;

  constructor(storageKey = "controllers", {fetch} = {}) {
    this.storageKey = storageKey;
    this.#fetch = fetch;
    const json = JSON.parse(localStorage.getItem(storageKey));
    this.hosts = json || [];
    this.#constructControllers();
  }

  #createController(host) {
    return new ESPHomeWebController(host, { 
      fetch: this.#fetch, 
      EventSource: curry(FetchEventSource, {fetch: this.#fetch})
    });
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

  registerHost(host) {
    if (this.hosts.includes(host)) {
      return this.controllers[host];
    }
    this.hosts.push(host);
    this.controllers[host] = this.#createController(host);
    this.#flush();
    return this.controllers[host];
  }

  removeHost(host) {
    if (!this.hosts.includes(host)) {
      return;
    }
    this.hosts = this.hosts.filter(v => v != host);
    this.controllers[host].destroy();
    delete this.controllers[host];
    this.#flush();
  }
}
