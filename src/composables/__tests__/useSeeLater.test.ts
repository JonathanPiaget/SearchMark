import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing';
import { triggerStorageChange } from '@/test-utils/storageEvents';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

const KEY = 'searchmark_seeLaterFolder';

interface BookmarksApi {
	get(id: string): Promise<BookmarkTreeNode[]>;
	getTree(): Promise<BookmarkTreeNode[]>;
	create(bookmark: Browser.bookmarks.CreateDetails): Promise<BookmarkTreeNode>;
}

const bookmarks = browser.bookmarks as unknown as BookmarksApi;

function node(partial: Partial<BookmarkTreeNode>): BookmarkTreeNode {
	return partial as BookmarkTreeNode;
}

// useSeeLater keeps a module-level singleton (seeLaterFolderId). Reset the
// module before each test so the shared ref starts clean.
async function freshUseSeeLater() {
	vi.resetModules();
	const { useSeeLater } = await import('../useSeeLater');
	return useSeeLater();
}

beforeEach(() => {
	fakeBrowser.reset();
	vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('See Later');
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getOrCreateSeeLaterFolder', () => {
	it('returns the stored folder when it still exists, without creating one', async () => {
		await browser.storage.local.set({ [KEY]: 'F1' });
		vi.spyOn(bookmarks, 'get').mockResolvedValue([
			node({ id: 'F1', title: 'Read Later' }),
		]);
		const create = vi.spyOn(bookmarks, 'create');

		const { getOrCreateSeeLaterFolder, seeLaterFolderId } =
			await freshUseSeeLater();
		const result = await getOrCreateSeeLaterFolder();

		expect(result).toEqual({ id: 'F1', title: 'Read Later' });
		expect(seeLaterFolderId.value).toBe('F1');
		expect(create).not.toHaveBeenCalled();
	});

	it('clears an invalid stored id, then creates and persists a new folder', async () => {
		await browser.storage.local.set({ [KEY]: 'gone' });
		vi.spyOn(bookmarks, 'get').mockRejectedValue(new Error('missing'));
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
			node({ id: 'root', children: [node({ id: 'toolbar' })] }),
		]);
		vi.spyOn(bookmarks, 'create').mockResolvedValue(
			node({ id: 'NEW', title: 'See Later' }),
		);

		const { getOrCreateSeeLaterFolder, seeLaterFolderId } =
			await freshUseSeeLater();
		const result = await getOrCreateSeeLaterFolder();

		expect(result).toEqual({ id: 'NEW', title: 'See Later' });
		expect(seeLaterFolderId.value).toBe('NEW');
		const stored = await browser.storage.local.get(KEY);
		expect(stored[KEY]).toBe('NEW');
	});

	it('creates a new folder when nothing is stored', async () => {
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
			node({ id: 'root', children: [node({ id: 'toolbar' })] }),
		]);
		const create = vi
			.spyOn(bookmarks, 'create')
			.mockResolvedValue(node({ id: 'NEW', title: 'See Later' }));

		const { getOrCreateSeeLaterFolder, seeLaterFolderId } =
			await freshUseSeeLater();
		const result = await getOrCreateSeeLaterFolder();

		expect(result.id).toBe('NEW');
		expect(seeLaterFolderId.value).toBe('NEW');
		expect(create).toHaveBeenCalledOnce();
	});
});

describe('initSeeLater', () => {
	it('keeps a stored id that still exists', async () => {
		await browser.storage.local.set({ [KEY]: 'F1' });
		vi.spyOn(bookmarks, 'get').mockResolvedValue([node({ id: 'F1' })]);

		const { initSeeLater, seeLaterFolderId } = await freshUseSeeLater();
		await initSeeLater();

		expect(seeLaterFolderId.value).toBe('F1');
	});

	it('clears a stored id that no longer exists', async () => {
		await browser.storage.local.set({ [KEY]: 'gone' });
		vi.spyOn(bookmarks, 'get').mockRejectedValue(new Error('missing'));

		const { initSeeLater, seeLaterFolderId } = await freshUseSeeLater();
		await initSeeLater();

		expect(seeLaterFolderId.value).toBeNull();
		const stored = await browser.storage.local.get(KEY);
		expect(stored[KEY]).toBeUndefined();
	});
});

describe('storage.onChanged sync', () => {
	it('adopts a non-empty external value for the folder key', async () => {
		const { initSeeLater, seeLaterFolderId } = await freshUseSeeLater();
		await initSeeLater();

		await triggerStorageChange('local', {
			[KEY]: { oldValue: null, newValue: 'F2' },
		});

		expect(seeLaterFolderId.value).toBe('F2');
	});

	it('coerces an empty external value to null (validateStorageValue)', async () => {
		await browser.storage.local.set({ [KEY]: 'F1' });
		vi.spyOn(bookmarks, 'get').mockResolvedValue([node({ id: 'F1' })]);

		const { initSeeLater, seeLaterFolderId } = await freshUseSeeLater();
		await initSeeLater();
		expect(seeLaterFolderId.value).toBe('F1');

		await triggerStorageChange('local', {
			[KEY]: { oldValue: 'F1', newValue: '' },
		});

		expect(seeLaterFolderId.value).toBeNull();
	});

	it('ignores changes in a non-local storage area', async () => {
		const { initSeeLater, seeLaterFolderId } = await freshUseSeeLater();
		await initSeeLater();

		await triggerStorageChange('sync', {
			[KEY]: { oldValue: null, newValue: 'F2' },
		});

		expect(seeLaterFolderId.value).toBeNull();
	});
});
