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

export function useFolderTree() {
	const allFolders = ref<BookmarkFolder[]>([]);
	const folderMap = ref<Map<string, BookmarkFolder>>(new Map());

	const buildFolderTree = (
		nodes: BookmarkTreeNode[],
		parentPath = '',
		level = 0,
	): BookmarkFolder[] => {
		const folders: BookmarkFolder[] = [];

		for (const node of nodes) {
			if (!node.url) {
				const folder: BookmarkFolder = {
					id: node.id,
					title: node.title,
					path: parentPath,
					parentId: node.parentId,
					children: [],
				};

				folders.push(folder);

				if (node.children) {
					const currentPath = parentPath
						? `${parentPath} > ${node.title}`
						: node.title;
					const childFolders = buildFolderTree(
						node.children,
						currentPath,
						level + 1,
					);
					folder.children = childFolders.filter(
						(child) => child.parentId === node.id,
					);
					folders.push(...childFolders);
				}
			}
		}

		return folders;
	};

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
