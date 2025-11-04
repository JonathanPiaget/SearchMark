import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import {
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

	describe('highlightText', () => {
		it('returns unhighlighted text when query is empty', () => {
			const allFolders = ref([]);
			const { highlightText } = useFolderSearch(allFolders);

			const result = highlightText('Sample Text', '');

			expect(result).toEqual([{ text: 'Sample Text', highlighted: false }]);
		});

		it('highlights matching text correctly', () => {
			const allFolders = ref([]);
			const { highlightText } = useFolderSearch(allFolders);

			const result = highlightText('Hello World', 'World');

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ text: 'Hello ', highlighted: false });
			expect(result[1]).toEqual({ text: 'World', highlighted: true });
		});

		it('escapes special regex characters', () => {
			const allFolders = ref([]);
			const { highlightText } = useFolderSearch(allFolders);

			const result = highlightText('Cost: $100 (USD)', '$100');

			expect(result).toContainEqual({ text: '$100', highlighted: true });
		});

		it('highlights text case-insensitively', () => {
			const allFolders = ref([]);
			const { highlightText } = useFolderSearch(allFolders);

			const result = highlightText('JavaScript Tutorial', 'script');

			expect(
				result.some((part) => part.highlighted && part.text === 'Script'),
			).toBe(true);
		});
	});
});
