import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

const KEY = 'searchmark_theme';

// useTheme keeps module-level singletons (currentTheme, appliedTheme). Reset the
// module before each test so the shared refs start clean.
async function freshUseTheme() {
	vi.resetModules();
	const { useTheme } = await import('../useTheme');
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

describe('toggleTheme', () => {
	it('flips from the default applied "light" to "dark"', async () => {
		const { currentTheme, toggleTheme } = await freshUseTheme();
		await toggleTheme();
		expect(currentTheme.value).toBe('dark');
	});
});

describe('storage.onChanged sync', () => {
	it('updates currentTheme on an external local change to the theme key', async () => {
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();

		await fakeBrowser.storage.local.onChanged.trigger({
			[KEY]: { oldValue: 'auto', newValue: 'dark' },
		});

		expect(currentTheme.value).toBe('dark');
	});

	it('ignores changes in a non-local storage area', async () => {
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();

		await fakeBrowser.storage.sync.onChanged.trigger({
			[KEY]: { oldValue: 'auto', newValue: 'dark' },
		});

		expect(currentTheme.value).toBe('auto');
	});

	it('ignores changes to unrelated keys', async () => {
		const { currentTheme, initTheme } = await freshUseTheme();
		await initTheme();

		await fakeBrowser.storage.local.onChanged.trigger({
			somethingElse: { oldValue: 1, newValue: 2 },
		});

		expect(currentTheme.value).toBe('auto');
	});
});
