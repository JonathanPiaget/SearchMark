import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { quickSaveCurrentTab } from '@/utils/quickSave';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

const KEY = 'searchmark_seeLaterFolder';

interface BookmarksApi {
	get(id: string): Promise<BookmarkTreeNode[]>;
	getTree(): Promise<BookmarkTreeNode[]>;
	create(bookmark: Browser.bookmarks.CreateDetails): Promise<BookmarkTreeNode>;
}

interface TabsApi {
	query(info: Browser.tabs.QueryInfo): Promise<Browser.tabs.Tab[]>;
}

const bookmarks = browser.bookmarks as unknown as BookmarksApi;
const tabs = browser.tabs as unknown as TabsApi;

function node(partial: Partial<BookmarkTreeNode>): BookmarkTreeNode {
	return partial as BookmarkTreeNode;
}

function tab(partial: Partial<Browser.tabs.Tab>): Browser.tabs.Tab {
	return partial as Browser.tabs.Tab;
}

beforeEach(() => {
	fakeBrowser.reset();
	vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('See Later');
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('quickSaveCurrentTab', () => {
	it('saves the current tab into the stored See Later folder', async () => {
		await browser.storage.local.set({ [KEY]: 'F1' });
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ title: 'Page', url: 'https://example.com' }),
		]);
		vi.spyOn(bookmarks, 'get').mockResolvedValue([
			node({ id: 'F1', title: 'Read Later' }),
		]);
		const create = vi
			.spyOn(bookmarks, 'create')
			.mockResolvedValue(node({ id: 'B1' }));

		const result = await quickSaveCurrentTab();

		expect(create).toHaveBeenCalledWith({
			title: 'Page',
			url: 'https://example.com',
			parentId: 'F1',
		});
		expect(result).toEqual({ folderTitle: 'Read Later' });
	});

	it('creates the See Later folder when none is stored, then saves into it', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ title: 'Page', url: 'https://example.com' }),
		]);
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
			node({ id: 'root', children: [node({ id: 'toolbar' })] }),
		]);
		const create = vi
			.spyOn(bookmarks, 'create')
			.mockResolvedValueOnce(node({ id: 'NEW', title: 'See Later' }))
			.mockResolvedValueOnce(node({ id: 'B1' }));

		const result = await quickSaveCurrentTab();

		expect(create).toHaveBeenNthCalledWith(1, {
			parentId: 'toolbar',
			title: 'See Later',
		});
		expect(create).toHaveBeenNthCalledWith(2, {
			title: 'Page',
			url: 'https://example.com',
			parentId: 'NEW',
		});
		expect(result).toEqual({ folderTitle: 'See Later' });
	});

	it('falls back to the URL as title when the tab has none', async () => {
		await browser.storage.local.set({ [KEY]: 'F1' });
		vi.spyOn(tabs, 'query').mockResolvedValue([
			tab({ url: 'https://example.com' }),
		]);
		vi.spyOn(bookmarks, 'get').mockResolvedValue([
			node({ id: 'F1', title: 'Read Later' }),
		]);
		const create = vi
			.spyOn(bookmarks, 'create')
			.mockResolvedValue(node({ id: 'B1' }));

		await quickSaveCurrentTab();

		expect(create).toHaveBeenCalledWith({
			title: 'https://example.com',
			url: 'https://example.com',
			parentId: 'F1',
		});
	});

	it('throws when there is no active tab to save', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([]);

		await expect(quickSaveCurrentTab()).rejects.toThrow(
			'No active tab to save',
		);
	});
});
