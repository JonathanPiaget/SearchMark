import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { triggerStorageChange } from '@/test-utils/storageEvents';
import {
	getOrCreateSeeLaterFolder,
	getSeeLaterFolderId,
	quickSave,
	setSeeLaterFolderId,
	watchSeeLaterFolderId,
} from '@/utils/seeLater';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

const KEY = 'searchmark_seeLaterFolder';

interface BookmarksApi {
	get(id: string): Promise<BookmarkTreeNode[]>;
	getTree(): Promise<BookmarkTreeNode[]>;
	create(bookmark: Browser.bookmarks.CreateDetails): Promise<BookmarkTreeNode>;
	search(query: { title: string }): Promise<BookmarkTreeNode[]>;
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

const storedId = async () => (await browser.storage.local.get(KEY))[KEY];

const mockEmptyToolbarTree = () => {
	vi.spyOn(bookmarks, 'search').mockResolvedValue([]);
	vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
		node({ id: 'root', children: [node({ id: 'toolbar' })] }),
	]);
};

beforeEach(() => {
	fakeBrowser.reset();
	vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('See Later');
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getSeeLaterFolderId', () => {
	it('returns a stored id that still exists', async () => {
		await browser.storage.local.set({ [KEY]: 'F1' });
		vi.spyOn(bookmarks, 'get').mockResolvedValue([node({ id: 'F1' })]);

		await expect(getSeeLaterFolderId()).resolves.toBe('F1');
	});

	it('clears and returns null for a stored id that no longer exists', async () => {
		await browser.storage.local.set({ [KEY]: 'gone' });
		vi.spyOn(bookmarks, 'get').mockRejectedValue(new Error('missing'));

		await expect(getSeeLaterFolderId()).resolves.toBeNull();
		await expect(storedId()).resolves.toBeUndefined();
	});

	it('returns null when nothing is stored', async () => {
		await expect(getSeeLaterFolderId()).resolves.toBeNull();
	});
});

describe('setSeeLaterFolderId', () => {
	it('stores an id and clears it when given null', async () => {
		await setSeeLaterFolderId('F1');
		await expect(storedId()).resolves.toBe('F1');

		await setSeeLaterFolderId(null);
		await expect(storedId()).resolves.toBeUndefined();
	});
});

describe('watchSeeLaterFolderId', () => {
	it('reports a non-empty external value for the folder key', async () => {
		const callback = vi.fn();
		watchSeeLaterFolderId(callback);

		await triggerStorageChange('local', {
			[KEY]: { oldValue: null, newValue: 'F2' },
		});

		expect(callback).toHaveBeenCalledWith('F2');
	});

	it('coerces an empty external value to null', async () => {
		const callback = vi.fn();
		watchSeeLaterFolderId(callback);

		await triggerStorageChange('local', {
			[KEY]: { oldValue: 'F1', newValue: '' },
		});

		expect(callback).toHaveBeenCalledWith(null);
	});

	it('ignores changes in a non-local storage area', async () => {
		const callback = vi.fn();
		watchSeeLaterFolderId(callback);

		await triggerStorageChange('sync', {
			[KEY]: { oldValue: null, newValue: 'F2' },
		});

		expect(callback).not.toHaveBeenCalled();
	});

	it('stops reporting after unwatch', async () => {
		const callback = vi.fn();
		const unwatch = watchSeeLaterFolderId(callback);
		unwatch();

		await triggerStorageChange('local', {
			[KEY]: { oldValue: null, newValue: 'F2' },
		});

		expect(callback).not.toHaveBeenCalled();
	});
});

describe('getOrCreateSeeLaterFolder', () => {
	it('returns the stored folder when it still exists, without creating one', async () => {
		await browser.storage.local.set({ [KEY]: 'F1' });
		const get = vi
			.spyOn(bookmarks, 'get')
			.mockResolvedValue([node({ id: 'F1', title: 'Read Later' })]);
		const create = vi.spyOn(bookmarks, 'create');

		const result = await getOrCreateSeeLaterFolder();

		expect(result).toEqual({ id: 'F1', title: 'Read Later' });
		expect(get).toHaveBeenCalledOnce();
		expect(create).not.toHaveBeenCalled();
	});

	it('clears an invalid stored id, then creates and persists a new folder', async () => {
		await browser.storage.local.set({ [KEY]: 'gone' });
		vi.spyOn(bookmarks, 'get').mockRejectedValue(new Error('missing'));
		mockEmptyToolbarTree();
		vi.spyOn(bookmarks, 'create').mockResolvedValue(
			node({ id: 'NEW', title: 'See Later' }),
		);

		const result = await getOrCreateSeeLaterFolder();

		expect(result).toEqual({ id: 'NEW', title: 'See Later' });
		await expect(storedId()).resolves.toBe('NEW');
	});

	it('adopts an existing "See Later" folder instead of creating a duplicate', async () => {
		vi.spyOn(bookmarks, 'search').mockResolvedValue([
			node({ id: 'OLD', title: 'See Later' }),
		]);
		const create = vi.spyOn(bookmarks, 'create');

		const result = await getOrCreateSeeLaterFolder();

		expect(result).toEqual({ id: 'OLD', title: 'See Later' });
		expect(create).not.toHaveBeenCalled();
		await expect(storedId()).resolves.toBe('OLD');
	});

	it('adopts an existing folder titled in the active locale', async () => {
		vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('Voir Plus Tard');
		vi.spyOn(bookmarks, 'search').mockImplementation(async ({ title }) =>
			title === 'Voir Plus Tard'
				? [node({ id: 'OLD_FR', title: 'Voir Plus Tard' })]
				: [],
		);
		const create = vi.spyOn(bookmarks, 'create');

		const result = await getOrCreateSeeLaterFolder();

		expect(result).toEqual({ id: 'OLD_FR', title: 'Voir Plus Tard' });
		expect(create).not.toHaveBeenCalled();
	});

	it('ignores a bookmark (not a folder) titled "See Later" and creates a folder', async () => {
		vi.spyOn(bookmarks, 'search').mockResolvedValue([
			node({ id: 'B1', title: 'See Later', url: 'https://example.com' }),
		]);
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
			node({ id: 'root', children: [node({ id: 'toolbar' })] }),
		]);
		const create = vi
			.spyOn(bookmarks, 'create')
			.mockResolvedValue(node({ id: 'NEW', title: 'See Later' }));

		const result = await getOrCreateSeeLaterFolder();

		expect(result.id).toBe('NEW');
		expect(create).toHaveBeenCalledOnce();
	});

	it('creates a new folder in the bookmark toolbar when nothing is stored', async () => {
		mockEmptyToolbarTree();
		const create = vi
			.spyOn(bookmarks, 'create')
			.mockResolvedValue(node({ id: 'NEW', title: 'See Later' }));

		const result = await getOrCreateSeeLaterFolder();

		expect(result.id).toBe('NEW');
		expect(create).toHaveBeenCalledWith({
			parentId: 'toolbar',
			title: 'See Later',
		});
		await expect(storedId()).resolves.toBe('NEW');
	});
});

describe('quickSave', () => {
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

		const result = await quickSave();

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
		mockEmptyToolbarTree();
		const create = vi
			.spyOn(bookmarks, 'create')
			.mockResolvedValueOnce(node({ id: 'NEW', title: 'See Later' }))
			.mockResolvedValueOnce(node({ id: 'B1' }));

		const result = await quickSave();

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

	it('throws before touching the folder when there is no active tab', async () => {
		vi.spyOn(tabs, 'query').mockResolvedValue([]);
		const create = vi.spyOn(bookmarks, 'create');

		await expect(quickSave()).rejects.toThrow('No current tab');
		expect(create).not.toHaveBeenCalled();
	});
});
