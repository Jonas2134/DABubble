const CHANNEL_NAME = 'da-bubble-session';

interface BroadcastMessage {
  type: 'REQUEST_SESSION' | 'SESSION_RESPONSE' | 'SESSION_SET' | 'SESSION_REMOVE';
  key: string;
  value?: string;
}

export class CrossTabSessionStorage {
  private channel = new BroadcastChannel(CHANNEL_NAME);

  constructor() {
    this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const { type, key, value } = event.data;
      switch (type) {
        case 'REQUEST_SESSION': {
          const stored = sessionStorage.getItem(key);
          if (stored) {
            this.channel.postMessage({ type: 'SESSION_RESPONSE', key, value: stored });
          }
          break;
        }
        case 'SESSION_RESPONSE':
          if (value && !sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, value);
          }
          break;
        case 'SESSION_SET':
          if (value) sessionStorage.setItem(key, value);
          break;
        case 'SESSION_REMOVE':
          sessionStorage.removeItem(key);
          break;
      }
    };
  }

  async getItem(key: string): Promise<string | null> {
    const local = sessionStorage.getItem(key);
    if (local) return local;
    return this.requestFromOtherTab(key);
  }

  setItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
    this.channel.postMessage({ type: 'SESSION_SET', key, value });
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
    this.channel.postMessage({ type: 'SESSION_REMOVE', key });
  }

  private requestFromOtherTab(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.channel.removeEventListener('message', handler);
        resolve(null);
      }, 200);

      const handler = (event: MessageEvent<BroadcastMessage>) => {
        if (event.data.type === 'SESSION_RESPONSE' && event.data.key === key) {
          clearTimeout(timeout);
          this.channel.removeEventListener('message', handler);
          if (event.data.value) {
            sessionStorage.setItem(key, event.data.value);
          }
          resolve(event.data.value ?? null);
        }
      };

      this.channel.addEventListener('message', handler);
      this.channel.postMessage({ type: 'REQUEST_SESSION', key });
    });
  }
}
