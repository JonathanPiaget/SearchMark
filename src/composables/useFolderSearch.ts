import fuzzysort from 'fuzzysort';
import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import { highlightText } from '../utils/highlight';
import type { BookmarkFolder } from './useFolderTree';

export interface FolderSearchResult {
	folder: BookmarkFolder;
	indexes: readonly number[] | null;
}

const FUZZY_THRESHOLD = 0.3;
const FUZZY_STORAGE_KEY = 'searchmark_fuzzy_search';

export function useFolderSearch(allFolders: Ref<BookmarkFolder[]>) {
	const searchQuery = ref('');
	const searchResults = ref<FolderSearchResult[]>([]);
	const isFuzzyEnabled = ref(true);

	const loadFuzzyPreference = async (): Promise<void> => {
		const result = await browser.storage.local.get(FUZZY_STORAGE_KEY);
		if (result[FUZZY_STORAGE_KEY] !== undefined) {
			isFuzzyEnabled.value = result[FUZZY_STORAGE_KEY];
		}
	};

	watch(isFuzzyEnabled, (newValue) => {
		browser.storage.local.set({ [FUZZY_STORAGE_KEY]: newValue });
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
