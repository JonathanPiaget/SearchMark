import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { createWorkBookmarks } from '../../test-utils/bookmarkFactory';
import { useFolderSearch } from '../useFolderSearch';
import type { BookmarkFolder } from '../useFolderTree';

describe('useFolderSearch', () => {
	describe('exact mode', () => {
		it('returns empty results when query is empty', () => {
			const { searchQuery, searchResults, searchFolders, isFuzzyEnabled } =
				useFolderSearch(ref(createWorkBookmarks()));

			isFuzzyEnabled.value = false;
			searchQuery.value = '';
			searchFolders();

			expect(searchResults.value).toEqual([]);
		});

		it('finds folders case-insensitively with null indexes', () => {
			const { searchQuery, searchResults, searchFolders, isFuzzyEnabled } =
				useFolderSearch(ref(createWorkBookmarks()));

			isFuzzyEnabled.value = false;
			searchQuery.value = 'WORK';
			searchFolders();

			expect(searchResults.value).toHaveLength(2);
			expect(searchResults.value[0].folder.title).toBe('Work Projects');
			expect(searchResults.value[0].indexes).toBeNull();
		});
	});

	describe('fuzzy mode', () => {
		it('finds folders with fuzzy matching and returns indexes', () => {
			const folders: BookmarkFolder[] = [
				{ id: '1', title: 'kotlin-lang-lambda', path: '' },
				{ id: '2', title: 'javascript-tutorial', path: '' },
			];
			const { searchQuery, searchResults, searchFolders, isFuzzyEnabled } =
				useFolderSearch(ref(folders));

			isFuzzyEnabled.value = true;
			searchQuery.value = 'ktln';
			searchFolders();

			expect(searchResults.value).toHaveLength(1);
			expect(searchResults.value[0].folder.title).toBe('kotlin-lang-lambda');
			expect(searchResults.value[0].indexes!.length).toBeGreaterThan(0);
		});

		it('filters out poor matches based on threshold', () => {
			const folders: BookmarkFolder[] = [{ id: '1', title: 'xyz', path: '' }];
			const { searchQuery, searchResults, searchFolders, isFuzzyEnabled } =
				useFolderSearch(ref(folders));

			isFuzzyEnabled.value = true;
			searchQuery.value = 'abc';
			searchFolders();

			expect(searchResults.value).toHaveLength(0);
		});
	});

	describe('highlightText', () => {
		it('highlights by indexes when provided (fuzzy)', () => {
			const { highlightText } = useFolderSearch(ref([]));

			const result = highlightText('Hello', '', [0, 2, 4]);

			expect(result).toEqual([
				{ text: 'H', highlighted: true },
				{ text: 'e', highlighted: false },
				{ text: 'l', highlighted: true },
				{ text: 'l', highlighted: false },
				{ text: 'o', highlighted: true },
			]);
		});

		it('highlights by substring when indexes is null (exact)', () => {
			const { highlightText } = useFolderSearch(ref([]));

			const result = highlightText('Hello World', 'World', null);

			expect(result).toEqual([
				{ text: 'Hello ', highlighted: false },
				{ text: 'World', highlighted: true },
			]);
		});

		it('groups consecutive highlighted characters', () => {
			const { highlightText } = useFolderSearch(ref([]));

			const result = highlightText('Hello', '', [0, 1, 2]);

			expect(result).toEqual([
				{ text: 'Hel', highlighted: true },
				{ text: 'lo', highlighted: false },
			]);
		});

		it('preserves original case in substring mode', () => {
			const { highlightText } = useFolderSearch(ref([]));

			const result = highlightText('JavaScript', 'script', null);

			expect(result).toContainEqual({ text: 'Script', highlighted: true });
		});
	});
});
