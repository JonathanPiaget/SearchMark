import fuzzysort from 'fuzzysort';
import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import { highlightText } from '../utils/highlight';
import type { BookmarkFolder } from './useFolderTree';

export interface FolderSearchResult {
	folder: BookmarkFolder;
	indexes: readonly number[] | null;
}

export const FUZZY_THRESHOLD = 0.3;
const fuzzySearchItem = storage.defineItem<boolean>(
	'local:searchmark_fuzzy_search',
	{ fallback: true },
);

export function useFolderSearch(allFolders: Ref<BookmarkFolder[]>) {
	const searchQuery = ref('');
	const searchResults = ref<FolderSearchResult[]>([]);
	const isFuzzyEnabled = ref(true);

	const loadFuzzyPreference = async (): Promise<void> => {
		isFuzzyEnabled.value = await fuzzySearchItem.getValue();
	};

	watch(isFuzzyEnabled, (newValue) => {
		fuzzySearchItem.setValue(newValue);
	});

	const searchFolders = (): void => {
		if (!searchQuery.value.trim()) {
			searchResults.value = [];
			return;
		}

		if (isFuzzyEnabled.value) {
			const results = fuzzysort.go(searchQuery.value, allFolders.value, {
				key: 'title',
				threshold: FUZZY_THRESHOLD,
			});
			searchResults.value = results.map((r) => ({
				folder: r.obj,
				indexes: r.indexes,
			}));
		} else {
			const query = searchQuery.value.toLowerCase();
			searchResults.value = allFolders.value
				.filter((folder) => folder.title.toLowerCase().includes(query))
				.map((folder) => ({ folder, indexes: null }));
		}
	};

	return {
		searchQuery,
		searchResults,
		searchFolders,
		highlightText,
		isFuzzyEnabled,
		loadFuzzyPreference,
	};
}
