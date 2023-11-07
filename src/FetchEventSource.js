function isComment(value) {
  return value.startsWith(':');
}

function isTermination(value) {
  // We split by \n, so we expect the empty line to be an empty string
  return value === '';
}

const fieldRegex = /^([a-z]+):\s?(.*)$/;

function isField(value) {
  return !!value.match(fieldRegex);
}

function getFieldNameAndValue(value) {
  const match = value.match(fieldRegex);
  return [match[1], match[2]];
}

function createMessage() {
  return {
    data: [],
    event: 'message',
  };
}

const READYSTATE_CONNECTING = 0;
const READYSTATE_OPEN = 1;
const READYSTATE_CLOSED = 2;

export default class EventSource extends EventTarget {
  constructor(url, {fetchOptions} = {}) {
    super();
    this._allowCors = false;
    this._abortController = new AbortController();
    const { signal } = this._abortController;
    const targetAddressSpace = globalThis.isSecureContext ? {
      targetAddressSpace: 'private',
    } : {};
    this._fetchOptions = Object.assign({
      signal,
    }, fetchOptions, targetAddressSpace);
    this._url = url;
    this._lastEventId = '';
    this._retryTimeout = 30000;
    this._connect();
  }

  _getFetchHeaders() {
    if (this._allowCors) {
      return {
        'Last-Event-ID': this._lastEventId,
        'Accept': 'text/event-stream',
      };
    } 
    return {};
  }

  _connect() {
    this.readyState = READYSTATE_CONNECTING;
    fetch(this._url, { ...this._fetchOptions, headers: this._getFetchHeaders()}).then(this._onResponse, this._onError);
  }

  close() {
    this._abortController.abort();
  }

  _onError = (e) => {
    if (e.name === 'AbortError') {
      this.readyState = READYSTATE_CLOSED;
      return;
    }
    console.error(e);
    this.dispatchEvent(new Event('error'));
    setTimeout(this._retryTimeout, () => {
      this._connect();
    });
    this.readyState = READYSTATE_CONNECTING;
  }

  _onMessageComplete(message) {
    const dataField = message.data;
    const data = dataField.length > 0 ? dataField.join('\n') : null;
    const lastEventId = this._lastEventId;
    const messageEvent = new MessageEvent(message.event, {data, lastEventId});
    this.dispatchEvent(messageEvent);
  }

  _onConnected = () => {
    this.readyState = READYSTATE_OPEN;
    this.dispatchEvent(new Event('open'));
  }

  _onResponse = async (response) => {
    if (!response.ok) {
      return this._onError(response);
    }

    this._onConnected();
    
    try {
      const stream = await response.body;
      const textStream = stream.pipeThrough(new TextDecoderStream());
      const reader = textStream.getReader();

      let message = createMessage();
      do {
        const {done, value} = await reader.read();
        if (done) {
          break;
        }


        const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        if (!normalized.endsWith('\n')) {
          console.warn('Message wasn\'t terminated by a newline character');
          continue;
        }
        const lines = normalized.substr(0, normalized.length  - 1).split('\n');

        lines.forEach((value) => {
          if (isComment(value)) {
            return;
          }

          if (isField(value)) {
            const [fieldName, fieldValue] = getFieldNameAndValue(value);

            switch (fieldName) {
              case 'data':
                message.data.push(fieldValue);
                break;
              case 'id':
                this._lastEventId = fieldValue;
                break;
              case 'retry':
                this._retryTimeout = parseInt(fieldValue);
                break;
              case 'event':
                message.event  = fieldValue;
                break;
            }
            return;
          }

          if (isTermination(value)) {
            this._onMessageComplete(message);
            message = createMessage();
            return;
          }
        });
      } while(true);
    } catch(e) {
      this._onError(e);
    }
  }
}
globalThis.EventSource = EventSource;
