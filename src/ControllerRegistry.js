import { ESPHomeWebController } from 'esphome-web';

function createController(host) {
  return new ESPHomeWebController(host, { targetAddressSpace: 'private' });
}

class ControllerRegistry {
  constructor(storageKey = "controllers") {
    this.storageKey = storageKey;
    const json = JSON.parse(localStorage.getItem(storageKey));
    this.hosts = json || [];
    this._buildControllers();
  }

  _buildControllers() {
    if (!this.controllers) {
      this.controllers = {};
    }
    this.hosts.forEach(host => {
      if (!(host in this.controllers)) {
        this.controllers[host] = createController(host);
      }
    });
  }

  _flush() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.hosts));
  }

  registerHost(host) {
    if (this.hosts.includes(host)) {
      return this.controllers[host];
    }
    this.hosts.push(host);
    this.controllers[host] = createController(host);
    this._flush();
    return this.controllers[host];
  }

  removeHost(host) {
    if (!this.hosts.includes(host)) {
      return;
    }
    this.hosts = this.hosts.filter(v => v != host);
    this.controllers[host].destroy();
    delete this.controllers[host];
    this._flush();
  }
}

export default ControllerRegistry;
