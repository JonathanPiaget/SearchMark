import type { Ref } from 'vue';
import { ref } from 'vue';
import { joinFolderPath } from '@/utils/bookmark';
import type { BookmarkFolder } from './useFolderTree';

export interface BookmarkItem {
	id: string;
	title: string;
	url: string;
	parentId: string;
	parentPath: string;
	dateAdded?: number;
}

export type BookmarkErrorKey = 'folderNotFound' | 'errorLoadingBookmarks';

export interface UseBookmarkFolderReturn {
	bookmarks: Ref<BookmarkItem[]>;
	isLoading: Ref<boolean>;
	error: Ref<BookmarkErrorKey | null>;
	loadBookmarks: (folderId: string, recursive?: boolean) => Promise<void>;
	loadAllBookmarks: () => Promise<void>;
	removeBookmark: (id: string) => void;
}

const walkBookmarks = async (
	parent: Browser.bookmarks.BookmarkTreeNode,
	basePath: string,
	canDescend: (child: Browser.bookmarks.BookmarkTreeNode) => boolean,
): Promise<BookmarkItem[]> => {
	const children =
		parent.children || (await browser.bookmarks.getChildren(parent.id));
	const results: BookmarkItem[] = [];

	for (const child of children) {
		if (child.url) {
			results.push({
				id: child.id,
				title: child.title,
				url: child.url,
				parentId: child.parentId || parent.id,
				parentPath: basePath,
				dateAdded: child.dateAdded,
			});
		} else if (canDescend(child)) {
			const subfolderPath = joinFolderPath(basePath, child.title);
			results.push(...(await walkBookmarks(child, subfolderPath, canDescend)));
		}
	}

	return results;
};

export function useBookmarkFolder(
	folderMap: Ref<Map<string, BookmarkFolder>>,
): UseBookmarkFolderReturn {
	const bookmarks = ref<BookmarkItem[]>([]);
	const isLoading = ref(false);
	const error = ref<BookmarkErrorKey | null>(null);

	const runLoad = async (
		load: () => Promise<BookmarkItem[]>,
	): Promise<void> => {
		isLoading.value = true;
		error.value = null;

		try {
			bookmarks.value = await load();
		} catch (err) {
			error.value ??= 'errorLoadingBookmarks';
			bookmarks.value = [];
			throw err;
		} finally {
			isLoading.value = false;
		}
	};

	const loadBookmarks = (folderId: string, recursive = true): Promise<void> =>
		runLoad(async () => {
			const folder = folderMap.value.get(folderId);
			if (!folder) {
				error.value = 'folderNotFound';
				throw new Error('Folder not found');
			}

			const fullPath = joinFolderPath(folder.path, folder.title);

			return walkBookmarks(
				{ id: folderId } as Browser.bookmarks.BookmarkTreeNode,
				fullPath,
				(child) => recursive && folderMap.value.has(child.id),
			);
		});

	const loadAllBookmarks = (): Promise<void> =>
		runLoad(async () => {
			const [tree] = await browser.bookmarks.getTree();
			const rootFolders = tree.children || [];
			const allResults: BookmarkItem[] = [];

			for (const rootFolder of rootFolders) {
				if (!rootFolder.url && rootFolder.id !== '0') {
					const subBookmarks = await walkBookmarks(
						rootFolder,
						rootFolder.title,
						(child) => Boolean(child.title),
					);
					allResults.push(...subBookmarks);
				}
			}

			return allResults;
		});

	const removeBookmark = (id: string) => {
		bookmarks.value = bookmarks.value.filter((b) => b.id !== id);
	};

	return {
		bookmarks,
		isLoading,
		error,
		loadBookmarks,
		loadAllBookmarks,
		removeBookmark,
	};
}
