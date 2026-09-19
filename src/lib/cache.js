/**
 * Tiny in-memory TTL cache. Good enough for a single-process API that proxies
 * TMDB; swap for Redis if the API is ever scaled horizontally.
 */
export class TtlCache {
  #store = new Map();
  #maxEntries;

  constructor({ maxEntries = 2000 } = {}) {
    this.#maxEntries = maxEntries;
  }

  get(key) {
    const hit = this.#store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.#store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key, value, ttlMs) {
    if (this.#store.size >= this.#maxEntries) {
      // Map preserves insertion order, so the first key is the oldest entry.
      const oldest = this.#store.keys().next().value;
      this.#store.delete(oldest);
    }
    this.#store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key) {
    this.#store.delete(key);
  }

  /**
   * Returns the cached value or computes it with `factory` and stores it.
   * Concurrent callers for the same key share one in-flight promise so a burst
   * of identical requests results in a single upstream call.
   */
  async remember(key, ttlMs, factory) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = factory().then(
      (value) => {
        this.set(key, value, ttlMs);
        return value;
      },
      (err) => {
        this.delete(key);
        throw err;
      },
    );
    this.set(key, pending, Math.min(ttlMs, 30_000));
    return pending;
  }

  clear() {
    this.#store.clear();
  }
}
