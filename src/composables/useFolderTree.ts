import { ref } from 'vue';
import type { Browser } from 'wxt/browser';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

export interface BookmarkFolder {
	id: string;
	title: string;
	path: string;
	parentId?: string;
	children?: BookmarkFolder[];
}

export const buildFolderTree = (
	nodes: BookmarkTreeNode[],
	parentPath = '',
): BookmarkFolder[] => {
	const folders: BookmarkFolder[] = [];

	for (const node of nodes) {
		if (node.url) continue;

		const folder: BookmarkFolder = {
			id: node.id,
			title: node.title,
			path: parentPath,
			parentId: node.parentId,
			children: [],
		};

		folders.push(folder);

		if (node.children && node.children.length > 0) {
			const currentPath = parentPath
				? `${parentPath} > ${node.title}`
				: node.title;

			const childFolders = buildFolderTree(node.children, currentPath);

			folder.children = childFolders.filter(
				(child) => child.parentId === node.id,
			);

			folders.push(...childFolders);
		}
	}

	return folders;
};

export function useFolderTree() {
	const folderMap = ref<Map<string, BookmarkFolder>>(new Map());
	const allFolders = ref<BookmarkFolder[]>([]);

	const loadFolders = async () => {
		try {
			const tree = await browser.bookmarks.getTree();
			const folders = buildFolderTree(tree);

			allFolders.value = folders.filter(
				(folder) => folder.title !== '' && folder.id !== '0',
			);

			folderMap.value.clear();
			for (const folder of allFolders.value) {
				folderMap.value.set(folder.id, folder);
			}
		} catch (error) {
			console.error('Error loading folders:', error);
		}
	};

	return {
		allFolders,
		folderMap,
		loadFolders,
	};
}
