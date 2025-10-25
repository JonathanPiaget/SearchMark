import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import {
	createFolders,
	createNestedFolders,
	createSpecialCharFolders,
	createWorkBookmarks,
} from '../../test-utils/bookmarkFactory';
import { useFolderSearch } from '../useFolderSearch';

describe('useFolderSearch', () => {
	describe('searchFolders', () => {
		it('returns empty results when query is empty', () => {
			const allFolders = ref(createWorkBookmarks());
			const { searchQuery, searchResults, searchFolders } =
				useFolderSearch(allFolders);

			searchQuery.value = '';
			searchFolders();

			expect(searchResults.value).toEqual([]);
		});

		it('finds folders by name (case-insensitive)', () => {
			const allFolders = ref(createWorkBookmarks());
			const { searchQuery, searchResults, searchFolders } =
				useFolderSearch(allFolders);

			searchQuery.value = 'WORK';
			searchFolders();

			expect(searchResults.value).toHaveLength(2);
			expect(searchResults.value[0].title).toBe('Work Projects');
			expect(searchResults.value[1].title).toBe('work notes');
		});

		it('limits results to 10 folders maximum', () => {
			const allFolders = ref(createFolders(15));
			const { searchQuery, searchResults, searchFolders } =
				useFolderSearch(allFolders);

			searchQuery.value = 'Folder'; // Matches all 15 folders
			searchFolders();

			expect(searchResults.value).toHaveLength(10);
		});

		it('finds folders with special characters', () => {
			const allFolders = ref(createSpecialCharFolders());
			const { searchQuery, searchResults, searchFolders } =
				useFolderSearch(allFolders);

			searchQuery.value = '$100';
			searchFolders();

			expect(searchResults.value).toHaveLength(1);
			expect(searchResults.value[0].title).toBe('Price: $100 (USD)');
		});

		it('searches within nested folder structures', () => {
			const allFolders = ref(createNestedFolders());
			const { searchQuery, searchResults, searchFolders } =
				useFolderSearch(allFolders);

			searchQuery.value = 'Fiction';
			searchFolders();

			expect(searchResults.value.length).toBeGreaterThan(0);
			expect(searchResults.value.some((r) => r.title === 'Fiction')).toBe(true);
		});
	});
});
