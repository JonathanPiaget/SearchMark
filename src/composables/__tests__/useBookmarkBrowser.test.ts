import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useBookmarkBrowser } from '@/composables/useBookmarkBrowser';
import type { BookmarkFolder } from '@/composables/useFolderTree';

vi.mock('@/utils/logger', () => ({ logError: vi.fn() }));

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

interface BookmarksApi {
	getChildren(id: string): Promise<BookmarkTreeNode[]>;
	getTree(): Promise<BookmarkTreeNode[]>;
}

const bookmarks = browser.bookmarks as unknown as BookmarksApi;

const node = (partial: Partial<BookmarkTreeNode>) =>
	partial as BookmarkTreeNode;

const link = (id: string, title: string, parentId: string) =>
	node({ id, title, url: `https://${id}`, parentId });

const folderMap = ref(
	new Map<string, BookmarkFolder>([
		['f1', { id: 'f1', title: 'Work', path: 'Work' }],
		['sub', { id: 'sub', title: 'Sub', path: 'Work > Sub' }],
	]),
);

const stubChildren = () =>
	vi.spyOn(bookmarks, 'getChildren').mockImplementation(async (id) => {
		if (id === 'f1') return [link('b1', 'Alpha', 'f1'), node({ id: 'sub' })];
		if (id === 'sub') return [link('b2', 'Beta', 'sub')];
		return [];
	});

const stubTree = (titles: string[]) =>
	vi.spyOn(bookmarks, 'getTree').mockResolvedValue([
		node({
			id: 'root',
			children: [
				node({
					id: '1',
					title: 'Toolbar',
					children: titles.map((title, i) => link(`t${i}`, title, '1')),
				}),
			],
		}),
	]);

const flush = async () => {
	await nextTick();
	await new Promise((resolve) => setTimeout(resolve));
};

const setup = async () => {
	const browserState = useBookmarkBrowser(folderMap);
	await browserState.init();
	return browserState;
};

const ids = (state: ReturnType<typeof useBookmarkBrowser>) =>
	state.results.value.map((r) => r.item.id);

beforeEach(() => {
	fakeBrowser.reset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('useBookmarkBrowser', () => {
	it('loads the selected folder with the stored recursive preference', async () => {
		await storage.setItem('local:searchmark_recursive_search', false);
		stubChildren();
		const state = await setup();

		state.folderId.value = 'f1';
		await flush();
		expect(ids(state)).toEqual(['b1']);

		state.recursive.value = true;
		await flush();
		expect(ids(state)).toEqual(['b1', 'b2']);
		expect(await storage.getItem('local:searchmark_recursive_search')).toBe(
			true,
		);
	});

	it('shows nothing without a folder until a query is typed, then loads all bookmarks once', async () => {
		const getTree = stubTree(['Alpha', 'Beta']);
		const state = await setup();

		await flush();
		expect(getTree).not.toHaveBeenCalled();
		expect(state.results.value).toEqual([]);

		state.filterQuery.value = 'al';
		await flush();
		expect(ids(state)).toEqual(['t0']);

		state.filterQuery.value = 'be';
		await flush();
		expect(ids(state)).toEqual(['t1']);
		expect(getTree).toHaveBeenCalledTimes(1);
	});

	it('returns indexes in fuzzy mode and null in exact mode, and persists the choice', async () => {
		stubTree(['Alpha']);
		const state = await setup();
		state.filterQuery.value = 'ala';
		await flush();

		expect(state.results.value[0]?.indexes).toEqual([0, 1, 4]);

		state.fuzzy.value = false;
		expect(state.results.value).toEqual([]);
		state.filterQuery.value = 'alp';
		expect(state.results.value[0]?.indexes).toBeNull();
		await flush();
		expect(await storage.getItem('local:searchmark_fuzzy_filter')).toBe(false);
	});

	it('caps results and reports the hidden count', async () => {
		stubTree(Array.from({ length: 120 }, (_, i) => `Item ${i}`));
		const state = await setup();
		state.filterQuery.value = 'item';
		await flush();

		expect(state.results.value).toHaveLength(100);
		expect(state.hiddenCount.value).toBe(20);
	});

	it('remove drops the bookmark from both the folder and the all-bookmarks lists', async () => {
		stubChildren();
		stubTree(['Alpha']);
		const state = await setup();
		state.filterQuery.value = 'alpha';
		await flush();
		state.folderId.value = 'f1';
		state.filterQuery.value = '';
		await flush();

		state.remove('b1');
		state.remove('t0');

		expect(ids(state)).toEqual(['b2']);
		state.folderId.value = '';
		state.filterQuery.value = 'alpha';
		expect(ids(state)).toEqual([]);
	});

	it('surfaces a load failure through error and logs it', async () => {
		const { logError } = await import('@/utils/logger');
		vi.spyOn(bookmarks, 'getChildren').mockRejectedValue(new Error('boom'));
		const state = await setup();

		state.folderId.value = 'f1';
		await flush();

		expect(state.error.value).toBe('errorLoadingBookmarks');
		expect(state.isLoading.value).toBe(false);
		expect(logError).toHaveBeenCalledWith(
			'Failed to load bookmarks',
			expect.any(Error),
		);
	});
});
