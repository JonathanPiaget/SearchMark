import { ref } from 'vue';
import type { BookmarkFolder } from './useFolderTree';

export interface SearchResultItem {
	folder: BookmarkFolder;
	type: 'match' | 'parent';
}

export function useFolderSearch(
	allFolders: ReturnType<
		typeof import('./useFolderTree').useFolderTree
	>['allFolders'],
) {
	const searchQuery = ref('');
	const searchResults = ref<SearchResultItem[]>([]);

	const searchFolders = (): void => {
		if (!searchQuery.value.trim()) {
			searchResults.value = [];
			return;
		}

		const query = searchQuery.value.toLowerCase();
		const results: SearchResultItem[] = [];
		const addedIds = new Set<string>();

		for (const folder of allFolders.value) {
			const titleMatch = folder.title.toLowerCase().includes(query);

			if (titleMatch) {
				if (!addedIds.has(folder.id)) {
					results.push({
						folder,
						type: 'match',
					});
					addedIds.add(folder.id);
				}
			}
		}

		searchResults.value = results.slice(0, 10);
	};

	const highlightText = (text: string, query: string) => {
		if (!query.trim()) return [{ text, highlighted: false }];

		const regex = new RegExp(
			`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
			'gi',
		);

		const parts = text.split(regex);
		const result = [];

		for (let i = 0; i < parts.length; i++) {
			if (parts[i]) {
				const highlighted = regex.test(parts[i]);
				result.push({ text: parts[i], highlighted });
			}
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
