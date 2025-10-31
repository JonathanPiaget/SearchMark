import { describe, expect, it } from 'vitest';
import { createFolder } from '../../test-utils/bookmarkFactory';
import { buildFolderPath } from '../useBookmarkSearch';
import type { BookmarkFolder } from '../useFolderTree';

describe('buildFolderPath', () => {
	it('returns empty string when folder not found', () => {
		const folderMap = new Map<string, BookmarkFolder>();

		expect(buildFolderPath('non-existent', folderMap)).toBe('');
	});

	it('returns folder title for root-level folder', () => {
		const folderMap = new Map<string, BookmarkFolder>();
		folderMap.set('1', createFolder({ id: '1', title: 'Work', path: '' }));

		expect(buildFolderPath('1', folderMap)).toBe('Work');
	});

	it('builds complete path for nested folders', () => {
		const folderMap = new Map<string, BookmarkFolder>();
		folderMap.set(
			'2',
			createFolder({
				id: '2',
				title: 'Frontend',
				path: 'Bookmarks Bar > Dev',
			}),
		);

		expect(buildFolderPath('2', folderMap)).toBe(
			'Bookmarks Bar > Dev > Frontend',
		);
	});
});
