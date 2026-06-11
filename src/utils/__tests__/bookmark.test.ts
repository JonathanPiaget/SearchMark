import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import {
	findBookmarksByUrl,
	getBookmarkToolbarId,
	joinFolderPath,
} from '@/utils/bookmark';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

interface BookmarksApi {
	getTree(): Promise<BookmarkTreeNode[]>;
	get(idOrIdList: string | string[]): Promise<BookmarkTreeNode[]>;
	search(query: string | { url?: string }): Promise<BookmarkTreeNode[]>;
}

const bookmarks = browser.bookmarks as unknown as BookmarksApi;

function rootTree(children: Partial<BookmarkTreeNode>[]): BookmarkTreeNode[] {
	return [{ id: '0', title: '', children } as BookmarkTreeNode];
}

function stubUserAgent(userAgent: string): void {
	vi.stubGlobal('navigator', { userAgent });
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('joinFolderPath', () => {
	it('joins a parent path with the title using the separator', () => {
		expect(joinFolderPath('Bar > Dev', 'Frontend')).toBe(
			'Bar > Dev > Frontend',
		);
	});

	it('returns the title alone when the parent path is empty', () => {
		expect(joinFolderPath('', 'Toolbar')).toBe('Toolbar');
	});
});

describe('findBookmarksByUrl', () => {
	it('returns an empty array without querying when the url is empty', async () => {
		const searchSpy = vi.spyOn(bookmarks, 'search');

		expect(await findBookmarksByUrl('')).toEqual([]);
		expect(searchSpy).not.toHaveBeenCalled();
	});

	it('keeps only exact url matches', async () => {
		vi.spyOn(bookmarks, 'search').mockResolvedValue([
			{ id: '1', title: 'Exact', url: 'https://a.com/' },
			{ id: '2', title: 'Partial', url: 'https://a.com/page' },
		] as BookmarkTreeNode[]);

		const matches = await findBookmarksByUrl('https://a.com/');

		expect(matches).toHaveLength(1);
		expect(matches[0].id).toBe('1');
	});

	it('returns an empty array when the search throws', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(bookmarks, 'search').mockRejectedValue(new Error('boom'));

		expect(await findBookmarksByUrl('https://a.com/')).toEqual([]);
	});
});

describe('getBookmarkToolbarId', () => {
	it('returns the first root child on Chrome', async () => {
		stubUserAgent('Mozilla/5.0 Chrome/120');
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue(
			rootTree([{ id: 'chrome-toolbar' }, { id: 'other' }]),
		);

		expect(await getBookmarkToolbarId()).toBe('chrome-toolbar');
	});

	it('falls back to "1" on Chrome when there are no root children', async () => {
		stubUserAgent('Mozilla/5.0 Chrome/120');
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue(rootTree([]));

		expect(await getBookmarkToolbarId()).toBe('1');
	});

	it('returns the predefined toolbar id on Firefox when it exists', async () => {
		stubUserAgent('Mozilla/5.0 Firefox/120');
		vi.spyOn(bookmarks, 'get').mockResolvedValue([
			{ id: 'toolbar_____', title: 'Bookmarks Toolbar' },
		] as BookmarkTreeNode[]);

		expect(await getBookmarkToolbarId()).toBe('toolbar_____');
	});

	it('falls back to the second root child on Firefox when get throws', async () => {
		stubUserAgent('Mozilla/5.0 Firefox/120');
		vi.spyOn(bookmarks, 'get').mockRejectedValue(new Error('no id'));
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue(
			rootTree([{ id: 'menu' }, { id: 'ff-toolbar' }]),
		);

		expect(await getBookmarkToolbarId()).toBe('ff-toolbar');
	});

	it('falls back to the second root child on Firefox when get returns empty', async () => {
		stubUserAgent('Mozilla/5.0 Firefox/120');
		vi.spyOn(bookmarks, 'get').mockResolvedValue([]);
		vi.spyOn(bookmarks, 'getTree').mockResolvedValue(
			rootTree([{ id: 'menu' }, { id: 'ff-toolbar' }]),
		);

		expect(await getBookmarkToolbarId()).toBe('ff-toolbar');
	});

	it('returns "1" when the bookmark tree cannot be read', async () => {
		stubUserAgent('Mozilla/5.0 Chrome/120');
		vi.spyOn(bookmarks, 'getTree').mockRejectedValue(new Error('denied'));

		expect(await getBookmarkToolbarId()).toBe('1');
	});
});
