import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getCurrentTab, isBlankPage } from '@/utils/tabs';

interface TabsApi {
	query(info: Browser.tabs.QueryInfo): Promise<Browser.tabs.Tab[]>;
}

const tabs = browser.tabs as unknown as TabsApi;

function tab(partial: Partial<Browser.tabs.Tab>): Browser.tabs.Tab {
	return partial as Browser.tabs.Tab;
}

beforeEach(() => {
	fakeBrowser.reset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getCurrentTab', () => {
	it('returns the url and title of the active tab', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ title: 'Page', url: 'https://example.com' }),
		]);

		await expect(getCurrentTab()).resolves.toEqual({
			title: 'Page',
			url: 'https://example.com',
			rawUrl: 'https://example.com',
			removedParams: [],
		});
	});

	it('falls back to the url as title when the tab has none', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ url: 'https://example.com' }),
		]);

		await expect(getCurrentTab()).resolves.toEqual({
			title: 'https://example.com',
			url: 'https://example.com',
			rawUrl: 'https://example.com',
			removedParams: [],
		});
	});

	it('removes tracking parameters from the url', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ title: 'Page', url: 'https://example.com/?id=1&utm_source=x' }),
		]);

		await expect(getCurrentTab()).resolves.toEqual({
			title: 'Page',
			url: 'https://example.com/?id=1',
			rawUrl: 'https://example.com/?id=1&utm_source=x',
			removedParams: ['utm_source'],
		});
	});

	it('keeps tracking parameters when the setting is off', async () => {
		await storage.setItem('local:searchmark_stripTrackingParams', false);
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ title: 'Page', url: 'https://example.com/?utm_source=x' }),
		]);

		await expect(getCurrentTab()).resolves.toEqual({
			title: 'Page',
			url: 'https://example.com/?utm_source=x',
			rawUrl: 'https://example.com/?utm_source=x',
			removedParams: [],
		});
	});

	it('throws when there is no active tab', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([]);

		await expect(getCurrentTab()).rejects.toThrow('No current tab');
	});

	it('throws when the active tab has no url', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([tab({ title: 'Blank' })]);

		await expect(getCurrentTab()).rejects.toThrow('No current tab');
	});
});

describe('isBlankPage', () => {
	it.each([
		'',
		'about:blank',
		'about:newtab',
		'About:NewTab',
		'chrome://newtab/',
	])('is true for %j', (url) => expect(isBlankPage(url)).toBe(true));

	it.each([
		'https://example.com',
		'about:config',
		'chrome://extensions/shortcuts',
	])('is false for %j', (url) => expect(isBlankPage(url)).toBe(false));
});
