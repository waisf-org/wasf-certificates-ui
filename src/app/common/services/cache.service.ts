import { Injectable } from '@angular/core';

interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
	private cache = new Map<string, CacheEntry<unknown>>();
	private inFlight = new Map<string, Promise<unknown>>();

	getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;
		if (entry && Date.now() - entry.timestamp < ttlMs) {
			return Promise.resolve(entry.data);
		}

		const existing = this.inFlight.get(key) as Promise<T> | undefined;
		if (existing) {
			return existing;
		}

		const request = fetcher()
			.then((data) => {
				this.cache.set(key, { data, timestamp: Date.now() });
				return data;
			})
			.finally(() => {
				this.inFlight.delete(key);
			});

		this.inFlight.set(key, request);
		return request;
	}

	invalidate(keyPrefix: string) {
		for (const key of this.cache.keys()) {
			if (key.startsWith(keyPrefix)) {
				this.cache.delete(key);
			}
		}
	}
}
