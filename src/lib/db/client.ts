import { QueryBuilder } from './queryBuilder';
import { BrowserAuth } from './auth';

class LocalBrowserClient {
  public auth: BrowserAuth;
  private baseUrl: string;

  constructor() {
    this.auth = new BrowserAuth();
    this.baseUrl = typeof window !== 'undefined' ? '/rest/v1' : 'http://127.0.0.1:5430';
  }

  from(table: string): QueryBuilder {
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mixingvault_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          token = parsed?.access_token || null;
        }
      } catch {}
    }
    return new QueryBuilder(table, {
      baseUrl: this.baseUrl,
      authToken: token,
    });
  }
}

let clientInstance: LocalBrowserClient | null = null;

export function getDbBrowserClient(): LocalBrowserClient {
  if (!clientInstance) {
    clientInstance = new LocalBrowserClient();
  }
  return clientInstance;
}
