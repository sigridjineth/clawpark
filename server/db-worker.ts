export interface D1Database {
  prepare<T extends unknown[] = unknown[], R = unknown>(query: string): {
    bind: (...params: T) => {
      first<TOut = R>(): Promise<TOut | null>;
      all<TOut = R>(): Promise<{ results: TOut[] }>;
      run<TOut = unknown>(): Promise<TOut>;
    };
  };
}

export interface WorkerSqlDatabase {
  prepare<T extends unknown[] = unknown[], R = unknown>(sql: string): {
    get: (...params: T) => Promise<R | undefined>;
    all: (...params: T) => Promise<R[]>;
    run: (...params: T) => Promise<unknown>;
  };
  exec(sql: string): Promise<void>;
}

export function createWorkerDatabase(d1: D1Database): WorkerSqlDatabase {
  return {
    prepare<T extends unknown[] = unknown[], R = unknown>(sql: string) {
      const stmt = d1.prepare<T, R>(sql);
      return {
        async get(...params: T) {
          const row = await stmt.bind(...params).first<R | null>();
          return row ?? undefined;
        },
        async all(...params: T) {
          const { results } = await stmt.bind(...params).all<R>();
          return results;
        },
        async run(...params: T) {
          return stmt.bind(...params).run();
        },
      };
    },
    async exec(sql: string) {
      await d1.prepare(sql).bind().run();
    },
  };
}

