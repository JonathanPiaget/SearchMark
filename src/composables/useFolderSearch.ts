import { ref } from 'vue';
import type { BookmarkFolder } from './useFolderTree';

export interface HighlightedTextPart {
	text: string;
	highlighted: boolean;
}

export function useFolderSearch(
	allFolders: ReturnType<
		typeof import('./useFolderTree').useFolderTree
	>['allFolders'],
) {
	const searchQuery = ref('');
	const searchResults = ref<BookmarkFolder[]>([]);

	const searchFolders = (): void => {
		if (!searchQuery.value.trim()) {
			searchResults.value = [];
			return;
		}

		const query = searchQuery.value.toLowerCase();
		const results: BookmarkFolder[] = [];
		const addedIds = new Set<string>();

		for (const folder of allFolders.value) {
			const titleMatch = folder.title.toLowerCase().includes(query);

			if (titleMatch) {
				if (!addedIds.has(folder.id)) {
					results.push(folder);
					addedIds.add(folder.id);
				}
			}
		}

		searchResults.value = results.slice(0, 10);
	};

	const highlightText = (
		text: string,
		query: string,
	): HighlightedTextPart[] => {
		if (!query.trim()) return [{ text, highlighted: false }];

		const result: HighlightedTextPart[] = [];
		const lowerText = text.toLowerCase();
		const lowerQuery = query.toLowerCase();
		let lastIndex = 0;

		let index = lowerText.indexOf(lowerQuery);

		while (index !== -1) {
			// Add non-highlighted text before the match
			if (index > lastIndex) {
				result.push({
					text: text.substring(lastIndex, index),
					highlighted: false,
				});
			}

			// Add the highlighted match (preserve original case!)
			result.push({
				text: text.substring(index, index + query.length),
				highlighted: true,
			});

			lastIndex = index + query.length;
			index = lowerText.indexOf(lowerQuery, lastIndex);
		}

		// Add remaining text after last match
		if (lastIndex < text.length) {
			result.push({
				text: text.substring(lastIndex),
				highlighted: false,
			});
		}

		return result;
	};

	return {
		searchQuery,
		searchResults,
		searchFolders,
		highlightText,
	};
}
