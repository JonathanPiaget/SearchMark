import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isProxy } from 'vue';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useFolderTree } from '@/composables/useFolderTree';
import { useSaveBookmark } from '@/composables/useSaveBookmark';
import { stubLocales } from '@/test-utils/locales';
import * as notifyModule from '@/utils/notify';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;
type CreateDetails = Browser.bookmarks.CreateDetails;

const bookmarks = browser.bookmarks as unknown as {
	getTree(): Promise<BookmarkTreeNode[]>;
	create(
		details: CreateDetails,
	): Promise<Pick<BookmarkTreeNode, 'id' | 'title'>>;
};

const BOOKMARK = { title: 'Apple Tart', url: 'https://example.com/tart' };

const tree = (toolbarChildren: Partial<BookmarkTreeNode>[] = []) =>
	[
		{
			id: '0',
			title: '',
			children: [
				{
					id: 'toolbar',
					title: 'Toolbar',
					parentId: '0',
					children: toolbarChildren,
				},
			],
		},
	] as BookmarkTreeNode[];

let created: CreateDetails[];
let failNextBookmark: boolean;
let notify: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
	fakeBrowser.reset();
	await stubLocales();
	created = [];
	failNextBookmark = false;
	let nextId = 1;
	vi.spyOn(bookmarks, 'create').mockImplementation(async (details) => {
		created.push(details);
		if (details.url && failNextBookmark) {
			failNextBookmark = false;
			throw new Error('create failed');
		}
		return { id: `new-${nextId++}`, title: details.title ?? '' };
	});
	vi.spyOn(bookmarks, 'getTree').mockResolvedValue(tree());
	notify = vi.spyOn(notifyModule, 'notify').mockReturnValue();
	await useFolderTree().refreshFolders();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('useSaveBookmark', () => {
	it('saves into the bookmark toolbar when no folder is chosen', async () => {
		const { save } = useSaveBookmark();

		await save(BOOKMARK);

		expect(created).toEqual([{ ...BOOKMARK, parentId: 'toolbar' }]);
		expect(notify).toHaveBeenCalledWith('Bookmark saved successfully');
	});

	it('saves into the chosen folder and names it', async () => {
		const { save, selectedFolderId, selectedFolderName } = useSaveBookmark();
		selectedFolderId.value = 'work';
		selectedFolderName.value = 'Work';

		await save(BOOKMARK);

		expect(created).toEqual([{ ...BOOKMARK, parentId: 'work' }]);
		expect(notify).toHaveBeenCalledWith('Bookmark saved to "Work"');
	});

	it('creates the pending folder first, then saves inside it', async () => {
		const { save, pendingFolder, selectedFolderId, selectedFolderName } =
			useSaveBookmark();
		pendingFolder.value = { title: 'Tarts', parentId: 'toolbar' };

		await save(BOOKMARK);

		expect(created).toEqual([
			{ title: 'Tarts', parentId: 'toolbar' },
			{ ...BOOKMARK, parentId: 'new-1' },
		]);
		expect(pendingFolder.value).toBeNull();
		expect(selectedFolderId.value).toBe('new-1');
		expect(selectedFolderName.value).toBe('Tarts');
		expect(notify).toHaveBeenCalledWith(
			'Bookmark saved to the new folder "Tarts"',
		);
	});

	it('hands bookmarks.create a plain object, not a Vue proxy (Firefox rejects proxies)', async () => {
		const { save, pendingFolder } = useSaveBookmark();
		pendingFolder.value = { title: 'Tarts', parentId: 'toolbar' };

		await save(BOOKMARK);

		expect(created.map(isProxy)).toEqual([false, false]);
	});

	it('reloads the folder tree after creating the pending folder', async () => {
		const getTree = vi.mocked(bookmarks.getTree);
		getTree.mockResolvedValue(
			tree([{ id: 'new-1', title: 'Tarts', parentId: 'toolbar' }]),
		);
		getTree.mockClear();
		const { save, pendingFolder } = useSaveBookmark();
		pendingFolder.value = { title: 'Tarts', parentId: 'toolbar' };

		await save(BOOKMARK);

		expect(getTree).toHaveBeenCalledOnce();
		expect(useFolderTree().allFolders.value.map((f) => f.id)).toContain(
			'new-1',
		);
	});

	it('a retry after the bookmark fails reuses the created folder', async () => {
		failNextBookmark = true;
		const { save, pendingFolder, selectedFolderId } = useSaveBookmark();
		pendingFolder.value = { title: 'Tarts', parentId: 'toolbar' };

		await expect(save(BOOKMARK)).rejects.toThrow('create failed');
		expect(pendingFolder.value).toBeNull();
		expect(selectedFolderId.value).toBe('new-1');
		expect(notify).not.toHaveBeenCalled();

		await save(BOOKMARK);

		expect(created.map((d) => d.parentId)).toEqual([
			'toolbar',
			'new-1',
			'new-1',
		]);
		expect(created.filter((d) => !d.url)).toHaveLength(1);
		expect(notify).toHaveBeenCalledWith('Bookmark saved to "Tarts"');
	});
});
