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
  #preventCors = true;
  #abortController = new AbortController();
  #fetch;
  #url;
  #lastEventId = '';
  #retryTimeout = 5000;
  #retryRef = 0;

  constructor(url, {fetch} = {}) {
    super();
    const { signal } = this.#abortController;
    this.#fetch = fetch || globalThis.fetch;
    this.#url = url;
    this.#connect();
  }

  #getFetchHeaders() {
    if (!this.#preventCors) {
      return {
        'Last-Event-ID': this.#lastEventId,
        'Accept': 'text/event-stream',
      };
    } 
    return {};
  }

  #getFetchOptions() {
    const { signal } = this.#abortController;
    return {
      headers: this.#getFetchHeaders(),
      signal,
    };
  }

  #connect() {
    this.#cancelRetry();
    this.readyState = READYSTATE_CONNECTING;
    this.#fetch.call(undefined, this.#url, this.#getFetchOptions()).then(this.#onResponse, this.#onFetchError);
  }

  close() {
    this.#abortController.abort();
    this.#cancelRetry();
  }

  #cancelRetry() {
    if (!this.#retryRef) {
      return;
    }
    clearTimeout(this.#retryRef);
    this.#retryRef = 0;
  }

  #retryConnection() {
    this.#cancelRetry();
    console.log('retry connection');
    this.#retryRef = setTimeout(() => {
      this.#connect();
    }, this.#retryTimeout);
    this.readyState = READYSTATE_CONNECTING;
  }

  #closeConnection() {
    this.#cancelRetry();
    this.readyState = READYSTATE_CLOSED;
  }

  #failConnection() {
    this.#closeConnection();
    this.dispatchEvent(new Event('error'));
  }

  #onFetchError = (e) => {
    if (e.name === 'AbortError') {
      return this.#closeConnection();
    }
    this.#failConnection();
  }

  #onMessageComplete(message) {
    const dataField = message.data;
    const data = dataField.length > 0 ? dataField.join('\n') : null;
    const lastEventId = this.#lastEventId;
    const messageEvent = new MessageEvent(message.event, {data, lastEventId});
    this.dispatchEvent(messageEvent);
  }

  #onConnected = () => {
    this.readyState = READYSTATE_OPEN;
    this.dispatchEvent(new Event('open'));
  }

  #onResponse = async (response) => {
    if (!response.ok) {
      return this.#failConnection();
    }

    this.#onConnected();
    
    try {
      const stream = response.body;
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

        lines.forEach((line) => {
          if (isComment(line)) {
            return;
          }

          if (isField(line)) {
            const [fieldName, fieldValue] = getFieldNameAndValue(line);

            switch (fieldName) {
              case 'data':
                message.data.push(fieldValue);
                break;
              case 'id':
                this.#lastEventId = fieldValue;
                break;
              case 'retry':
                this.#retryTimeout = parseInt(fieldValue);
                break;
              case 'event':
                message.event  = fieldValue;
                break;
            }
            return;
          }

          if (isTermination(line)) {
            this.#onMessageComplete(message);
            message = createMessage();
            return;
          }
        });
      } while(true);
      console.warn('Reached end of stream');
      // Only exits out of while loop if end of stream was reached.
      this.#retryConnection();
    } catch(e) {
      if (e.name === 'AbortError') {
        return this.#closeConnection();
      }
      this.#retryConnection();
    }
  }
}
