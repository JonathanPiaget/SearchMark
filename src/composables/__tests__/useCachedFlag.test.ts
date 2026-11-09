import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useCachedFlag } from '@/composables/useCachedFlag';
import { stubLocalStorage } from '@/test-utils/localStorage';
import { triggerStorageChange } from '@/test-utils/storageEvents';

const KEY = 'test_flag';
const cache = stubLocalStorage();

beforeEach(() => {
	fakeBrowser.reset();
	cache.clear();
});

describe('useCachedFlag', () => {
	it('defaults to true when nothing is cached or stored', async () => {
		const { flag, load } = useCachedFlag(KEY);
		expect(flag.value).toBe(true);
		await load();
		expect(flag.value).toBe(true);
	});

	it('starts from the cached value before storage answers', () => {
		cache.set(KEY, 'false');
		expect(useCachedFlag(KEY).flag.value).toBe(false);
	});

	it('load takes the stored value and refreshes the cache', async () => {
		await storage.setItem(`local:${KEY}`, false);
		const { flag, load } = useCachedFlag(KEY);
		await load();
		await nextTick();
		expect(flag.value).toBe(false);
		expect(cache.get(KEY)).toBe('false');
	});

	it('a change writes both the cache and storage', async () => {
		const { flag } = useCachedFlag(KEY);
		flag.value = false;
		await nextTick();
		expect(cache.get(KEY)).toBe('false');
		expect(await storage.getItem(`local:${KEY}`)).toBe(false);
	});

	it('follows a change made elsewhere to the same key', async () => {
		const a = useCachedFlag(KEY);
		const b = useCachedFlag(KEY);
		b.flag.value = false;
		await nextTick();
		await triggerStorageChange('local', {
			[KEY]: { oldValue: true, newValue: false },
		});
		expect(a.flag.value).toBe(false);
	});
});
