import { Injectable } from '@nestjs/common';

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class MetaCacheService {
  private readonly store = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = DEFAULT_TTL_MS,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await fetcher();
    this.set(key, value, ttlMs);
    return value;
  }
}
