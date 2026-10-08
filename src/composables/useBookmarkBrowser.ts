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
const fuzzyItem = storage.defineItem<boolean>('local:searchmark_fuzzy_filter', {
	fallback: true,
});

export function useBookmarkBrowser(
	folderMap: Ref<Map<string, BookmarkFolder>>,
) {
	const folderId = ref('');
	const filterQuery = ref('');
	const recursive = ref(true);
	const fuzzy = ref(true);

	const scoped = useBookmarkFolder(folderMap);
	const all = useBookmarkFolder(folderMap);
	let allLoading: Promise<void> | null = null;

	const source = computed(() => (folderId.value ? scoped : all));
	const isLoading = computed(() => source.value.isLoading.value);
	const error = computed(() => source.value.error.value);
	const query = computed(() => filterQuery.value.trim());

	const matches = computed<TitleMatch<BookmarkItem>[]>(() => {
		const items = source.value.bookmarks.value;
		if (query.value) {
			return matchByTitle(items, query.value, fuzzy.value, Infinity);
		}
		return folderId.value ? items.map((item) => ({ item, indexes: null })) : [];
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
			if (folderId.value) {
				await scoped.loadBookmarks(folderId.value, recursive.value);
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

	watch([folderId, recursive], load);
	watch(query, (value) => {
		if (value && !folderId.value) load();
	});
	watch(recursive, (value) => recursiveItem.setValue(value));
	watch(fuzzy, (value) => fuzzyItem.setValue(value));

	return {
		folderId,
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
