import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Browser } from 'wxt/browser';
import { useBookmarkFolder } from '@/composables/useBookmarkFolder';
import type { BookmarkFolder } from '@/composables/useFolderTree';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

interface BookmarksApi {
	getChildren(id: string): Promise<BookmarkTreeNode[]>;
	getTree(): Promise<BookmarkTreeNode[]>;
}

const bookmarks = browser.bookmarks as unknown as BookmarksApi;

function folderMapOf(folders: BookmarkFolder[]) {
	const map = new Map<string, BookmarkFolder>();
	for (const folder of folders) {
		map.set(folder.id, folder);
	}
	return ref(map);
}

function node(partial: Partial<BookmarkTreeNode>): BookmarkTreeNode {
	return partial as BookmarkTreeNode;
}

function stubChildren(byId: Record<string, BookmarkTreeNode[]>) {
	vi.spyOn(bookmarks, 'getChildren').mockImplementation(
		async (id: string) => byId[id] ?? [],
	);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('loadBookmarks — folder not found', () => {
	it('throws, sets folderNotFound, and clears bookmarks', async () => {
		const {
			loadBookmarks,
			error,
			bookmarks: items,
		} = useBookmarkFolder(folderMapOf([]));

		await expect(loadBookmarks('missing')).rejects.toThrow('Folder not found');
		expect(error.value).toBe('folderNotFound');
		expect(items.value).toEqual([]);
	});
});

describe('loadBookmarks — recursive (default)', () => {
	it('descends subfolders and sets parentPath from the resolved full path', async () => {
		const map = folderMapOf([
			{ id: 'f1', title: 'Work', path: '' },
			{ id: 'sub', title: 'Sub', path: 'Work' },
		]);
		stubChildren({
			f1: [
				node({ id: 'b1', title: 'A', url: 'https://a', parentId: 'f1' }),
				node({ id: 'sub', title: 'Sub', parentId: 'f1' }),
			],
			sub: [node({ id: 'b2', title: 'B', url: 'https://b', parentId: 'sub' })],
		});

		const { loadBookmarks, bookmarks: items } = useBookmarkFolder(map);
		await loadBookmarks('f1');

		expect(items.value).toEqual([
			expect.objectContaining({ id: 'b1', parentPath: 'Work', parentId: 'f1' }),
			expect.objectContaining({
				id: 'b2',
				parentPath: 'Work > Sub',
				parentId: 'sub',
			}),
		]);
	});

	it('prefixes the resolved full path with the folder path when present', async () => {
		const map = folderMapOf([
			{ id: 'f1', title: 'Frontend', path: 'Bar > Dev' },
		]);
		stubChildren({
			f1: [node({ id: 'b1', title: 'A', url: 'https://a', parentId: 'f1' })],
		});

		const { loadBookmarks, bookmarks: items } = useBookmarkFolder(map);
		await loadBookmarks('f1');

		expect(items.value[0].parentPath).toBe('Bar > Dev > Frontend');
	});

	it('skips a subfolder that is absent from the folder map', async () => {
		const map = folderMapOf([{ id: 'f1', title: 'Work', path: '' }]);
		stubChildren({
			f1: [
				node({ id: 'b1', title: 'A', url: 'https://a', parentId: 'f1' }),
				node({ id: 'orphan', title: 'Orphan', parentId: 'f1' }),
			],
			orphan: [node({ id: 'b2', title: 'B', url: 'https://b' })],
		});

		const { loadBookmarks, bookmarks: items } = useBookmarkFolder(map);
		await loadBookmarks('f1');

		expect(items.value.map((b) => b.id)).toEqual(['b1']);
	});

	it('sets errorLoadingBookmarks and rethrows when fetching children fails', async () => {
		const map = folderMapOf([{ id: 'f1', title: 'Work', path: '' }]);
		vi.spyOn(bookmarks, 'getChildren').mockRejectedValue(new Error('boom'));

		const { loadBookmarks, error, bookmarks: items } = useBookmarkFolder(map);

		await expect(loadBookmarks('f1')).rejects.toThrow('boom');
		expect(error.value).toBe('errorLoadingBookmarks');
		expect(items.value).toEqual([]);
	});
});

describe('loadBookmarks — direct (recursive = false)', () => {
	it('keeps only direct url children and ignores subfolders', async () => {
		const map = folderMapOf([{ id: 'f1', title: 'Work', path: '' }]);
		stubChildren({
			f1: [
				node({ id: 'b1', title: 'A', url: 'https://a', parentId: 'f1' }),
				node({ id: 'sub', title: 'Sub', parentId: 'f1' }),
			],
		});

		const { loadBookmarks, bookmarks: items } = useBookmarkFolder(map);
		await loadBookmarks('f1', false);

		expect(items.value).toEqual([
			expect.objectContaining({ id: 'b1', parentPath: 'Work', parentId: 'f1' }),
		]);
	});
});

describe('loadAllBookmarks', () => {
	it('walks root folders, skipping the root id "0" and url nodes', async () => {
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
			node({
				id: 'root',
				title: '',
				children: [
					node({
						id: '1',
						title: 'Toolbar',
						children: [
							node({ id: 'b1', title: 'A', url: 'https://a', parentId: '1' }),
						],
					}),
					node({
						id: '0',
						title: 'Zero',
						children: [node({ id: 'b2', title: 'B', url: 'https://b' })],
					}),
					node({ id: 'u', title: 'U', url: 'https://u' }),
				],
			}),
		]);

		const { loadAllBookmarks, bookmarks: items } = useBookmarkFolder(
			folderMapOf([]),
		);
		await loadAllBookmarks();

		expect(items.value).toEqual([
			expect.objectContaining({ id: 'b1', parentPath: 'Toolbar' }),
		]);
	});

	it('builds nested parentPath from the walked node titles', async () => {
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
			node({
				id: 'root',
				title: '',
				children: [
					node({
						id: '1',
						title: 'Toolbar',
						children: [
							node({
								id: '2',
								title: 'Dev',
								children: [
									node({
										id: 'b1',
										title: 'A',
										url: 'https://a',
										parentId: '2',
									}),
								],
							}),
						],
					}),
				],
			}),
		]);

		const { loadAllBookmarks, bookmarks: items } = useBookmarkFolder(
			folderMapOf([]),
		);
		await loadAllBookmarks();

		expect(items.value[0].parentPath).toBe('Toolbar > Dev');
	});

	it('sets errorLoadingBookmarks and rethrows when the tree fails', async () => {
		vi.spyOn(bookmarks, 'getTree').mockRejectedValue(new Error('boom'));

		const {
			loadAllBookmarks,
			error,
			bookmarks: items,
		} = useBookmarkFolder(folderMapOf([]));

		await expect(loadAllBookmarks()).rejects.toThrow('boom');
		expect(error.value).toBe('errorLoadingBookmarks');
		expect(items.value).toEqual([]);
	});
});

describe('removeBookmark', () => {
	it('removes the matching bookmark by id', async () => {
		const map = folderMapOf([{ id: 'f1', title: 'Work', path: '' }]);
		stubChildren({
			f1: [
				node({ id: 'b1', title: 'A', url: 'https://a', parentId: 'f1' }),
				node({ id: 'b2', title: 'B', url: 'https://b', parentId: 'f1' }),
			],
		});

		const {
			loadBookmarks,
			removeBookmark,
			bookmarks: items,
		} = useBookmarkFolder(map);
		await loadBookmarks('f1');
		removeBookmark('b1');

		expect(items.value.map((b) => b.id)).toEqual(['b2']);
	});
});
