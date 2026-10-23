import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
	isFolder,
	type SearchItem,
	useBookmarkBrowser,
} from '@/composables/useBookmarkBrowser';
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

const allFolders = ref<BookmarkFolder[]>([
	{ id: 'f1', title: 'Work', path: 'Work', parentId: '1' },
	{ id: 'sub', title: 'Sub', path: 'Work > Sub', parentId: 'f1' },
	{ id: 'deep', title: 'Deep', path: 'Work > Sub > Deep', parentId: 'sub' },
	{ id: 'other', title: 'Other', path: 'Other', parentId: '1' },
]);
const folderMap = ref(
	new Map(allFolders.value.map((folder) => [folder.id, folder])),
);

const stubChildren = () =>
	vi.spyOn(bookmarks, 'getChildren').mockImplementation(async (id) => {
		if (id === 'f1')
			return [link('b1', 'Alpha', 'f1'), node({ id: 'sub', title: 'Sub' })];
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

const cache = new Map<string, string>();
vi.stubGlobal('localStorage', {
	getItem: (key: string) => cache.get(key) ?? null,
	setItem: (key: string, value: string) => cache.set(key, value),
});

const flush = async () => {
	await nextTick();
	await new Promise((resolve) => setTimeout(resolve));
};

const setup = async () => {
	const browserState = useBookmarkBrowser(folderMap, allFolders);
	await browserState.init();
	return browserState;
};

const ids = (state: ReturnType<typeof useBookmarkBrowser>) =>
	state.results.value.map((r) => r.item.id);

beforeEach(() => {
	fakeBrowser.reset();
	cache.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('useBookmarkBrowser', () => {
	it('loads the selected folder with the stored recursive preference', async () => {
		await storage.setItem('local:searchmark_recursive_search', false);
		stubChildren();
		const state = await setup();

		state.scopeId.value = 'f1';
		await flush();
		expect(ids(state)).toEqual(['sub', 'b1']);

		state.recursive.value = true;
		await flush();
		expect(ids(state)).toEqual(['sub', 'deep', 'b1', 'b2']);
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

	it('returns indexes in both modes and persists the choice', async () => {
		stubTree(['Alpha']);
		const state = await setup();
		state.filterQuery.value = 'ala';
		await flush();

		expect(state.results.value[0]?.indexes).toEqual([0, 1, 4]);

		state.fuzzy.value = false;
		expect(state.results.value).toEqual([]);
		state.filterQuery.value = 'alp';
		expect(state.results.value[0]?.indexes).toEqual([0, 1, 2]);
		await flush();
		expect(await storage.getItem('local:searchmark_fuzzy_filter')).toBe(false);
	});

	it('starts from the cached fuzzy choice and caches changes', async () => {
		cache.set('searchmark_fuzzy_filter', 'false');
		const state = useBookmarkBrowser(folderMap, allFolders);
		expect(state.fuzzy.value).toBe(false);

		state.fuzzy.value = true;
		await flush();
		expect(cache.get('searchmark_fuzzy_filter')).toBe('true');
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
		state.scopeId.value = 'f1';
		state.filterQuery.value = '';
		await flush();

		state.remove('b1');
		state.remove('t0');

		expect(ids(state)).toEqual(['sub', 'deep', 'b2']);
		state.scopeId.value = '';
		state.filterQuery.value = 'alpha';
		expect(ids(state)).toEqual([]);
	});

	it('ranks folders and bookmarks together by match score', async () => {
		stubTree(['Sub guide', 'Workflow']);
		const state = await setup();
		state.filterQuery.value = 'sub';
		await flush();

		expect(ids(state)).toEqual(['sub', 't0']);
		expect(isFolder(state.results.value[0]?.item as SearchItem)).toBe(true);

		state.filterQuery.value = 'workf';
		expect(ids(state)).toEqual(['t1', 'f1']);
	});

	it('lists folders first in exact mode', async () => {
		stubTree(['Work']);
		const state = await setup();
		state.fuzzy.value = false;
		state.filterQuery.value = 'work';
		await flush();

		expect(ids(state)).toEqual(['f1', 't0']);
	});

	it('searches only folders inside the scope', async () => {
		stubChildren();
		const state = await setup();
		state.scopeId.value = 'f1';
		await flush();

		state.filterQuery.value = 'o';
		expect(ids(state)).toEqual([]);

		state.filterQuery.value = 'deep';
		expect(ids(state)).toEqual(['deep']);

		state.recursive.value = false;
		await flush();
		expect(ids(state)).toEqual([]);
	});

	it('surfaces a load failure through error and logs it', async () => {
		const { logError } = await import('@/utils/logger');
		vi.spyOn(bookmarks, 'getChildren').mockRejectedValue(new Error('boom'));
		const state = await setup();

		state.scopeId.value = 'f1';
		await flush();

		expect(state.error.value).toBe('errorLoadingBookmarks');
		expect(state.isLoading.value).toBe(false);
		expect(logError).toHaveBeenCalledWith(
			'Failed to load bookmarks',
			expect.any(Error),
		);
	});
});
