import type { Ref } from 'vue';
import { computed, ref, watch } from 'vue';
import type { BookmarkItem } from '@/composables/useBookmarkFolder';
import { useBookmarkFolder } from '@/composables/useBookmarkFolder';
import type { BookmarkFolder } from '@/composables/useFolderTree';
import { logError } from '@/utils/logger';
import type { TitleMatch } from '@/utils/matchByTitle';
import { matchByTitle } from '@/utils/matchByTitle';

const MAX_RESULTS = 100;
const recursiveItem = storage.defineItem<boolean>(
	'local:searchmark_recursive_search',
	{ fallback: true },
);
const FUZZY_KEY = 'searchmark_fuzzy_filter';
const fuzzyItem = storage.defineItem<boolean>(`local:${FUZZY_KEY}`, {
	fallback: true,
});

export type SearchItem = BookmarkItem | BookmarkFolder;

export const isFolder = (item: SearchItem): item is BookmarkFolder =>
	!('url' in item);

export function useBookmarkBrowser(
	folderMap: Ref<Map<string, BookmarkFolder>>,
	allFolders: Ref<BookmarkFolder[]>,
) {
	const scopeId = ref('');
	const filterQuery = ref('');
	const recursive = ref(true);
	// Cached so the first paint shows the stored choice before storage answers.
	const fuzzy = ref(localStorage.getItem(FUZZY_KEY) !== 'false');

	const scoped = useBookmarkFolder(folderMap);
	const all = useBookmarkFolder(folderMap);
	let allLoading: Promise<void> | null = null;

	const source = computed(() => (scopeId.value ? scoped : all));
	const isLoading = computed(() => source.value.isLoading.value);
	const error = computed(() => source.value.error.value);
	const query = computed(() => filterQuery.value.trim());

	const isInside = (folder: BookmarkFolder, ancestorId: string) => {
		for (let id = folder.parentId; id; id = folderMap.value.get(id)?.parentId) {
			if (id === ancestorId) return true;
		}
		return false;
	};

	const folders = computed(() => {
		if (!scopeId.value) return allFolders.value;
		return allFolders.value.filter((folder) =>
			recursive.value
				? isInside(folder, scopeId.value)
				: folder.parentId === scopeId.value,
		);
	});

	const items = computed<SearchItem[]>(() => [
		...folders.value,
		...source.value.bookmarks.value,
	]);

	const matches = computed<TitleMatch<SearchItem>[]>(() => {
		if (query.value) {
			return matchByTitle(items.value, query.value, fuzzy.value, Infinity);
		}
		return scopeId.value
			? items.value.map((item) => ({ item, indexes: null }))
			: [];
	});
	const results = computed(() => matches.value.slice(0, MAX_RESULTS));
	const hiddenCount = computed(() =>
		Math.max(0, matches.value.length - MAX_RESULTS),
	);

	const loadAll = () => {
		allLoading ??= all.loadAllBookmarks().catch((err) => {
			allLoading = null;
			throw err;
		});
		return allLoading;
	};

	const load = async () => {
		try {
			if (scopeId.value) {
				await scoped.loadBookmarks(scopeId.value, recursive.value);
			} else if (query.value) {
				await loadAll();
			}
		} catch (err) {
			logError('Failed to load bookmarks', err);
		}
	};

	const init = async () => {
		recursive.value = await recursiveItem.getValue();
		fuzzy.value = await fuzzyItem.getValue();
	};

	const remove = (id: string) => {
		scoped.removeBookmark(id);
		all.removeBookmark(id);
	};

	watch([scopeId, recursive], load);
	watch(query, (value) => {
		if (value && !scopeId.value) load();
	});
	watch(recursive, (value) => recursiveItem.setValue(value));
	watch(fuzzy, (value) => {
		localStorage.setItem(FUZZY_KEY, String(value));
		fuzzyItem.setValue(value);
	});

	return {
		scopeId,
		filterQuery,
		recursive,
		fuzzy,
		results,
		hiddenCount,
		isLoading,
		error,
		init,
		remove,
	};
}
