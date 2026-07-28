export interface Cache {
  /** SET key value EX ttl — overwrites existing keys. */
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  /** Increment counter; sets TTL only when the key is first created. */
  increment(key: string, ttlSeconds: number): Promise<number>;
  /** Decrement counter; floors at 0. */
  decrement(key: string): Promise<number>;
  /** SET key value EX ttl NX — returns true when the key was created. */
  setIfAbsent(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  /** Atomically GET and DELETE — required for one-time token consumption. */
  consume(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
}
