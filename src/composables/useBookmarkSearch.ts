import type { Ref } from 'vue';
import { ref } from 'vue';
import { findBookmarksByUrl, joinFolderPath } from '@/utils/bookmark';
import type { BookmarkFolder } from './useFolderTree';

export interface BookmarkLocation {
	id: string;
	title: string;
	url: string;
	folderPath: string;
	folderId: string;
}

/**
 * Builds a complete folder path from a folder ID using the folder map
 * @param folderId - The ID of the folder
 * @param folderMap - Map of folder IDs to BookmarkFolder objects
 * @returns Complete folder path (e.g., "Bookmarks Bar > Dev > Frontend")
 */
export const buildFolderPath = (
	folderId: string,
	folderMap: Map<string, BookmarkFolder>,
): string => {
	const folder = folderMap.get(folderId);
	if (!folder) return '';

	return joinFolderPath(folder.path, folder.title);
};

/**
 * Searches for bookmarks by URL and returns their locations with complete folder paths
 * @param url - The URL to search for
 * @param folderMap - Map of folder IDs to BookmarkFolder objects
 * @returns Array of bookmark locations with complete folder paths
 */
const searchBookmarksByUrl = async (
	url: string,
	folderMap: Map<string, BookmarkFolder>,
): Promise<BookmarkLocation[]> => {
	const bookmarks = await findBookmarksByUrl(url);

	return bookmarks
		.filter((bookmark) => bookmark.parentId)
		.map((bookmark) => ({
			id: bookmark.id,
			title: bookmark.title,
			url: bookmark.url || '',
			folderId: bookmark.parentId || '',
			folderPath: buildFolderPath(bookmark.parentId || '', folderMap),
		}));
};

/**
 * Composable for searching and managing bookmark locations
 */
export function useBookmarkSearch(folderMap: Ref<Map<string, BookmarkFolder>>) {
	const bookmarkLocations = ref<BookmarkLocation[]>([]);
	const isLoading = ref(false);

	const searchByUrl = async (url: string): Promise<void> => {
		isLoading.value = true;
		try {
			bookmarkLocations.value = await searchBookmarksByUrl(
				url,
				folderMap.value,
			);
		} finally {
			isLoading.value = false;
		}
	};

	return {
		bookmarkLocations,
		isLoading,
		searchByUrl,
	};
}
