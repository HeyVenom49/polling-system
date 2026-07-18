export interface Cache {
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
