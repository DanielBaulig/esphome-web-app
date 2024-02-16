// Sadly the web APIs for SerialPort and Serial are not strong enough
// to stand by themselves. I need to wrap them for some basic management
// tasks. For example there's no even on Serial that notifies that a new
// SerialPort become available (e.g. via a requestPort call) if it wasn't
// just physically connected to the host. Similarly, there's no even on
// Serial that a SerialPort became unavailable (i.e. was forgotten).
// SerialPort instances also do not track if they are open or not or fire
// events when they get opened or closed.

const betterSerial = navigator.serial;

function prototype(o) {
  return Object.getPrototypeOf(o);
}

function makeBetterPortPatches(original) {
  return {
    connected: true,
    opened: false,
    better: true,

    dispatchEvent(event) {
      switch (event.type) {
        case 'connect':
          this.connected = true;
          break;
        case 'disconnect':
          this.opened = false;
          this.connected = false;
          break;
      }

      return original.dispatchEvent(event);
    },
    async forget() {
      await original.forget();
      this.dispatchEvent(new Event('disconnect', { bubbles: true }));
    },
    async open(...args) {
      await original.open(...args);
      this.opened = true;
      this.dispatchEvent(new Event('open'));
    },
    async close(...args) {
      await original.close(...args);
      this.opened = false;
      this.dispatchEvent(new Event('close'));
    }
  };
};


function makeBetter(port) {
  if (!port.better) {
    port = monkeypatch(
      port,
      makeBetterPortPatches
    );
  }
  return port;
}

function monkeypatch(obj, getPatches) {
  const original = {};
  const patches = getPatches(original);

  for (const [m, f] of Object.entries(patches)) {
    if (typeof f === 'function') {
      original[m] = obj[m].bind(obj);
    }
    obj[m] = f;
  }

  return obj;
}

if (betterSerial) {
  monkeypatch(betterSerial, (original) => {
    return {
      async getPorts() {
        const ports = await original.getPorts();
        return ports.map(port => makeBetter(port));
      },
      async requestPort(...args) {
        const port = await original.requestPort(...args)
        // If the port is completely new we will need to fire
        // a connect event. But we can only tell before we make
        // it better, since makeBetter will set connected to true
        // given that the port is now obviously connected.
        const isFresh = !port.connected;
        const betterPort = makeBetter(port);
        if (isFresh) {
          betterPort.dispatchEvent(new Event('connect', { bubbles: true }));
        }

        return betterPort;
      },
    };
  });

  betterSerial.addEventListener('connect', (event) => {
    makeBetter(event.target)
  });
}

export default betterSerial;
