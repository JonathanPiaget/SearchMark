import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getCurrentTab } from '@/utils/tabs';

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
		});
	});

	it('falls back to the url as title when the tab has none', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ url: 'https://example.com' }),
		]);

		await expect(getCurrentTab()).resolves.toEqual({
			title: 'https://example.com',
			url: 'https://example.com',
		});
	});

	it('throws when there is no active tab', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([]);

		await expect(getCurrentTab()).rejects.toThrow('No active tab');
	});

	it('throws when the active tab has no url', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([tab({ title: 'Blank' })]);

		await expect(getCurrentTab()).rejects.toThrow('No active tab');
	});
});
