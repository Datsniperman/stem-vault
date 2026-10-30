import { DbResult } from './types';

export interface QueryOptions {
  baseUrl: string;
  authToken?: string | null;
}

export class QueryBuilder<T = any> implements PromiseLike<DbResult<T>> {
  private table: string;
  private baseUrl: string;
  private authToken?: string | null;

  private method: string = 'GET';
  private queryParams: string[] = [];
  private headers: Record<string, string> = {};
  private bodyPayload: any = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(table: string, options: QueryOptions) {
    this.table = table;
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.authToken = options.authToken;

    this.headers['Accept'] = 'application/json';
    if (this.authToken) {
      this.headers['Authorization'] = `Bearer ${this.authToken}`;
    }
  }

  select<TResult = any>(
    columns: string = '*',
    options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }
  ): QueryBuilder<TResult> {
    this.method = options?.head ? 'HEAD' : 'GET';
    this.queryParams.push(`select=${encodeURIComponent(columns)}`);

    if (options?.count) {
      this.headers['Prefer'] = `count=${options.count}`;
    }
    return this as any;
  }

  insert(values: any | any[], options?: { onConflict?: string }): this {
    this.method = 'POST';
    this.headers['Content-Type'] = 'application/json';
    let prefer = 'return=representation';
    if (options?.onConflict) {
      prefer += ',resolution=merge-duplicates';
    }
    this.headers['Prefer'] = prefer;
    this.bodyPayload = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(values: any | any[], options?: { onConflict?: string }): this {
    this.method = 'POST';
    this.headers['Content-Type'] = 'application/json';
    this.headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
    this.bodyPayload = Array.isArray(values) ? values : [values];
    if (options?.onConflict) {
      this.queryParams.push(`on_conflict=${encodeURIComponent(options.onConflict)}`);
    }
    return this;
  }

  update(values: any): this {
    this.method = 'PATCH';
    this.headers['Content-Type'] = 'application/json';
    this.headers['Prefer'] = 'return=representation';
    this.bodyPayload = values;
    return this;
  }

  delete(): this {
    this.method = 'DELETE';
    this.headers['Prefer'] = 'return=representation';
    return this;
  }

  eq(column: string, value: any): this {
    this.queryParams.push(`${column}=eq.${encodeURIComponent(String(value))}`);
    return this;
  }

  neq(column: string, value: any): this {
    this.queryParams.push(`${column}=neq.${encodeURIComponent(String(value))}`);
    return this;
  }

  gt(column: string, value: any): this {
    this.queryParams.push(`${column}=gt.${encodeURIComponent(String(value))}`);
    return this;
  }

  gte(column: string, value: any): this {
    this.queryParams.push(`${column}=gte.${encodeURIComponent(String(value))}`);
    return this;
  }

  lt(column: string, value: any): this {
    this.queryParams.push(`${column}=lt.${encodeURIComponent(String(value))}`);
    return this;
  }

  lte(column: string, value: any): this {
    this.queryParams.push(`${column}=lte.${encodeURIComponent(String(value))}`);
    return this;
  }

  filter(column: string, operator: string, value: any): this {
    this.queryParams.push(`${column}=${operator}.${encodeURIComponent(String(value))}`);
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.queryParams.push(`${column}=ilike.${encodeURIComponent(pattern)}`);
    return this;
  }

  in(column: string, values: any[]): this {
    const formatted = values
      .map(v => (typeof v === 'string' ? `"${v}"` : String(v)))
      .join(',');
    this.queryParams.push(`${column}=in.(${formatted})`);
    return this;
  }

  or(filters: string): this {
    this.queryParams.push(`or=(${filters})`);
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}): this {
    this.queryParams.push(`order=${column}.${ascending ? 'asc' : 'desc'}`);
    return this;
  }

  limit(count: number): this {
    this.queryParams.push(`limit=${count}`);
    return this;
  }

  range(from: number, to: number): this {
    this.headers['Range'] = `${from}-${to}`;
    return this;
  }

  single(): this {
    this.isSingle = true;
    this.headers['Accept'] = 'application/vnd.pgrst.object+json';
    return this;
  }

  maybeSingle(): this {
    this.isMaybeSingle = true;
    return this;
  }

  private parseCount(contentRange: string | null): number | null {
    if (!contentRange) return null;
    const match = contentRange.match(/\/(\d+|\*)$/);
    if (!match || match[1] === '*') return null;
    return parseInt(match[1], 10);
  }

  async execute(): Promise<DbResult<T>> {
    try {
      const qs = this.queryParams.length ? `?${this.queryParams.join('&')}` : '';
      const url = `${this.baseUrl}/${this.table}${qs}`;

      const response = await fetch(url, {
        method: this.method,
        headers: this.headers,
        body: this.bodyPayload ? JSON.stringify(this.bodyPayload) : undefined,
        cache: 'no-store',
      });

      const count = this.parseCount(response.headers.get('content-range'));

      if (!response.ok) {
        let errBody: any;
        try {
          errBody = await response.json();
        } catch {
          errBody = { message: await response.text() };
        }
        return {
          data: null,
          error: {
            message: errBody?.message || `Request failed with status ${response.status}`,
            code: errBody?.code || String(response.status),
            details: errBody?.details,
          },
          count,
        };
      }

      if (this.method === 'HEAD') {
        return { data: null, error: null, count };
      }

      const text = await response.text();
      let data: any = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (this.isMaybeSingle) {
        if (Array.isArray(data)) {
          data = data.length > 0 ? data[0] : null;
        }
      }

      return { data, error: null, count };
    } catch (err: any) {
      return {
        data: null,
        error: { message: err?.message || 'Database fetch error' },
      };
    }
  }

  then<TResult1 = DbResult<T>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
