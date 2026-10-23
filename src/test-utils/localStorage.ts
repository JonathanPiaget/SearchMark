import { vi } from 'vitest';

export function stubLocalStorage(): Map<string, string> {
	const store = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => store.set(key, value),
	});
	return store;
}
