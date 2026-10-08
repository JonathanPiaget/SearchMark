import type { Ref } from 'vue';
import { ref } from 'vue';
import { findBookmarksByUrl } from '@/utils/bookmark';
import type { BookmarkFolder } from './useFolderTree';

export interface BookmarkLocation {
	id: string;
	title: string;
	url: string;
	path: string;
	folderId: string;
}

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
			path: folderMap.get(bookmark.parentId || '')?.path ?? '',
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
