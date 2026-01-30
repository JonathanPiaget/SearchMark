import type { Ref } from 'vue';
import { ref } from 'vue';
import type { BookmarkFolder } from './useFolderTree';

export interface BookmarkItem {
	id: string;
	title: string;
	url: string;
	parentId: string;
	parentPath: string; // Relative path within selected folder
	dateAdded?: number;
}

export interface UseBookmarkFolderReturn {
	bookmarks: Ref<BookmarkItem[]>;
	isLoading: Ref<boolean>;
	error: Ref<string | null>;
	loadBookmarks: (folderId: string, recursive?: boolean) => Promise<void>;
	loadAllBookmarks: () => Promise<void>;
}

const fetchBookmarksFromNode = async (
	node: Browser.bookmarks.BookmarkTreeNode,
	basePath = '',
): Promise<BookmarkItem[]> => {
	const children =
		node.children || (await browser.bookmarks.getChildren(node.id));
	const results: BookmarkItem[] = [];

	for (const child of children) {
		if (child.url) {
			results.push({
				id: child.id,
				title: child.title,
				url: child.url,
				parentId: child.parentId || node.id,
				parentPath: basePath,
				dateAdded: child.dateAdded,
			});
		} else if (child.title) {
			const subfolderPath = basePath
				? `${basePath} > ${child.title}`
				: child.title;
			const subBookmarks = await fetchBookmarksFromNode(child, subfolderPath);
			results.push(...subBookmarks);
		}
	}
	return results;
};

export function useBookmarkFolder(
	folderMap: Ref<Map<string, BookmarkFolder>>,
): UseBookmarkFolderReturn {
	const bookmarks = ref<BookmarkItem[]>([]);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	const fetchBookmarksRecursive = async (
		folderId: string,
		basePath = '',
	): Promise<BookmarkItem[]> => {
		const folder = folderMap.value.get(folderId);
		if (!folder) return [];

		const children = await browser.bookmarks.getChildren(folderId);

		const results: BookmarkItem[] = [];

		for (const child of children) {
			if (child.url) {
				results.push({
					id: child.id,
					title: child.title,
					url: child.url,
					parentId: child.parentId || folderId,
					parentPath: basePath || folder.title,
					dateAdded: child.dateAdded,
				});
			} else {
				const subfolderPath = basePath
					? `${basePath} > ${child.title}`
					: child.title;
				const subBookmarks = await fetchBookmarksRecursive(
					child.id,
					subfolderPath,
				);
				results.push(...subBookmarks);
			}
		}

		return results;
	};

	const loadBookmarks = async (
		folderId: string,
		recursive = true,
	): Promise<void> => {
		isLoading.value = true;
		error.value = null;

		try {
			if (!folderMap.value.has(folderId)) {
				throw new Error('Folder not found');
			}

			if (recursive) {
				bookmarks.value = await fetchBookmarksRecursive(folderId);
			} else {
				const children = await browser.bookmarks.getChildren(folderId);
				const folder = folderMap.value.get(folderId);

				bookmarks.value = children
					.filter((child) => child.url)
					.map((child) => ({
						id: child.id,
						title: child.title,
						url: child.url || '',
						parentId: child.parentId || folderId,
						parentPath: folder?.title || '',
						dateAdded: child.dateAdded,
					}));
			}
		} catch (err) {
			error.value =
				err instanceof Error && err.message === 'Folder not found'
					? 'folderNotFound'
					: 'errorLoadingBookmarks';
			bookmarks.value = [];
			throw err;
		} finally {
			isLoading.value = false;
		}
	};

	const loadAllBookmarks = async (): Promise<void> => {
		isLoading.value = true;
		error.value = null;

		try {
			const [tree] = await browser.bookmarks.getTree();
			const rootFolders = tree.children || [];
			const allResults: BookmarkItem[] = [];

			for (const rootFolder of rootFolders) {
				if (!rootFolder.url && rootFolder.id !== '0') {
					const subBookmarks = await fetchBookmarksFromNode(
						rootFolder,
						rootFolder.title,
					);
					allResults.push(...subBookmarks);
				}
			}

			bookmarks.value = allResults;
		} catch (err) {
			error.value = 'errorLoadingBookmarks';
			bookmarks.value = [];
			throw err;
		} finally {
			isLoading.value = false;
		}
	};

	return {
		bookmarks,
		isLoading,
		error,
		loadBookmarks,
		loadAllBookmarks,
	};
}
