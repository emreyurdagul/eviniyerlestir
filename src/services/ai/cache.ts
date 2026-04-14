/** Basit LRU cache - AI yanitlari icin */
const MAX_SIZE = 50

class LRUCache<K, V> {
  private cache = new Map<K, V>()

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    const val = this.cache.get(key)!
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, val)
    return val
  }

  set(key: K, val: V) {
    if (this.cache.has(key)) this.cache.delete(key)
    this.cache.set(key, val)
    if (this.cache.size > MAX_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }
  }

  clear() { this.cache.clear() }
}

export const aiCache = new LRUCache<string, unknown>()

export function cacheKey(prefix: string, payload: unknown): string {
  return `${prefix}:${JSON.stringify(payload)}`
}
