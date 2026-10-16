import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { triggerStorageChange } from '@/test-utils/storageEvents';

const KEY = 'searchmark_theme';

// useTheme keeps module-level singletons (currentTheme, appliedTheme). Reset the
// module before each test so the shared refs start clean.
async function freshUseTheme() {
	vi.resetModules();
	const { useTheme } = await import('@/composables/useTheme');
	return useTheme();
}

beforeEach(() => {
	fakeBrowser.reset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('initTheme — load from storage', () => {
	it('defaults to "auto" when nothing is stored', async () => {
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();
		expect(currentTheme.value).toBe('auto');
	});

	it('adopts the stored preference', async () => {
		await browser.storage.local.set({ [KEY]: 'dark' });
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();
		expect(currentTheme.value).toBe('dark');
	});

	it('returns no media-query cleanup when window is unavailable', async () => {
		const { initTheme } = await freshUseTheme();
		const cleanup = await initTheme();
		expect(cleanup).toBeUndefined();
	});
});

describe('setTheme', () => {
	it('updates currentTheme and persists the preference', async () => {
		const { currentTheme, setTheme } = await freshUseTheme();
		await setTheme('light');
		expect(currentTheme.value).toBe('light');
		const stored = await browser.storage.local.get(KEY);
		expect(stored[KEY]).toBe('light');
	});
});

describe('cycleTheme', () => {
	it('cycles auto → light → dark → auto and persists each step', async () => {
		const { currentTheme, cycleTheme } = await freshUseTheme();
		for (const expected of ['light', 'dark', 'auto']) {
			await cycleTheme();
			expect(currentTheme.value).toBe(expected);
			const stored = await browser.storage.local.get(KEY);
			expect(stored[KEY]).toBe(expected);
		}
	});

	it('starts the cycle from the stored preference', async () => {
		await browser.storage.local.set({ [KEY]: 'dark' });
		const { currentTheme, cycleTheme, initTheme } = await freshUseTheme();
		await initTheme();
		await cycleTheme();
		expect(currentTheme.value).toBe('auto');
	});
});

describe('storage.onChanged sync', () => {
	it('updates currentTheme on an external local change to the theme key', async () => {
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();

		await triggerStorageChange('local', {
			[KEY]: { oldValue: 'auto', newValue: 'dark' },
		});

		expect(currentTheme.value).toBe('dark');
	});

	it('ignores changes in a non-local storage area', async () => {
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();

		await triggerStorageChange('sync', {
			[KEY]: { oldValue: 'auto', newValue: 'dark' },
		});

		expect(currentTheme.value).toBe('auto');
	});

	it('ignores changes to unrelated keys', async () => {
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();

		await triggerStorageChange('local', {
			somethingElse: { oldValue: 1, newValue: 2 },
		});

		expect(currentTheme.value).toBe('auto');
	});
});
