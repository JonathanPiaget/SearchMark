import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import { highlightText } from '@/utils/highlight';
import { matchByTitle } from '@/utils/matchByTitle';
import type { BookmarkFolder } from './useFolderTree';

export interface FolderSearchResult {
	folder: BookmarkFolder;
	indexes: readonly number[] | null;
}

const MAX_RESULTS = 50;
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
		searchResults.value = matchByTitle(
			allFolders.value,
			searchQuery.value,
			isFuzzyEnabled.value,
			MAX_RESULTS,
		).map(({ item, indexes }) => ({ folder: item, indexes }));
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
