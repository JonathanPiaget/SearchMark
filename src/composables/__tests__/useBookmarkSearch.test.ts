import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Browser } from 'wxt/browser';
import { useBookmarkSearch } from '@/composables/useBookmarkSearch';
import type { BookmarkFolder } from '@/composables/useFolderTree';
import { createFolder } from '@/test-utils/bookmarkFactory';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

const bookmarks = browser.bookmarks as unknown as {
	search(query: { url?: string }): Promise<BookmarkTreeNode[]>;
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('useBookmarkSearch', () => {
	it('returns each match with the path of the folder holding it', async () => {
		const folderMap = ref(
			new Map<string, BookmarkFolder>([
				[
					'2',
					createFolder({ id: '2', title: 'Frontend', path: 'Dev > Frontend' }),
				],
			]),
		);
		vi.spyOn(bookmarks, 'search').mockResolvedValue([
			{ id: 'a', title: 'A', url: 'https://a.com/', parentId: '2' },
			{ id: 'b', title: 'B', url: 'https://a.com/', parentId: 'gone' },
		] as BookmarkTreeNode[]);
		const { bookmarkLocations, searchByUrl } = useBookmarkSearch(folderMap);

		await searchByUrl('https://a.com/');

		expect(bookmarkLocations.value).toEqual([
			{
				id: 'a',
				title: 'A',
				url: 'https://a.com/',
				folderId: '2',
				path: 'Dev > Frontend',
			},
			{
				id: 'b',
				title: 'B',
				url: 'https://a.com/',
				folderId: 'gone',
				path: '',
			},
		]);
	});
});
