import fuzzysort from 'fuzzysort';
import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import type { BookmarkFolder } from './useFolderTree';

export interface HighlightedTextPart {
	text: string;
	highlighted: boolean;
}

export interface FolderSearchResult {
	folder: BookmarkFolder;
	indexes: readonly number[] | null;
}

const FUZZY_THRESHOLD = 0.3;
const FUZZY_STORAGE_KEY = 'searchmark_fuzzy_search';

function highlightByIndexes(
	text: string,
	indexes: readonly number[],
): HighlightedTextPart[] {
	if (indexes.length === 0) return [{ text, highlighted: false }];

	const result: HighlightedTextPart[] = [];
	const indexSet = new Set(indexes);
	let currentPart = '';
	let currentHighlighted = indexSet.has(0);

	for (let i = 0; i < text.length; i++) {
		const isHighlighted = indexSet.has(i);
		if (isHighlighted === currentHighlighted) {
			currentPart += text[i];
		} else {
			if (currentPart)
				result.push({ text: currentPart, highlighted: currentHighlighted });
			currentPart = text[i];
			currentHighlighted = isHighlighted;
		}
	}
	if (currentPart)
		result.push({ text: currentPart, highlighted: currentHighlighted });

	return result;
}

function highlightBySubstring(
	text: string,
	query: string,
): HighlightedTextPart[] {
	if (!query.trim()) return [{ text, highlighted: false }];

	const result: HighlightedTextPart[] = [];
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	let lastIndex = 0;
	let index = lowerText.indexOf(lowerQuery);

	while (index !== -1) {
		if (index > lastIndex) {
			result.push({
				text: text.substring(lastIndex, index),
				highlighted: false,
			});
		}
		result.push({
			text: text.substring(index, index + query.length),
			highlighted: true,
		});
		lastIndex = index + query.length;
		index = lowerText.indexOf(lowerQuery, lastIndex);
	}

	if (lastIndex < text.length) {
		result.push({ text: text.substring(lastIndex), highlighted: false });
	}

	return result;
}

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

	const highlightText = (
		text: string,
		query: string,
		indexes?: readonly number[] | null,
	): HighlightedTextPart[] => {
		return indexes?.length
			? highlightByIndexes(text, indexes)
			: highlightBySubstring(text, query);
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
