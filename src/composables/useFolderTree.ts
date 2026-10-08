import { ref } from 'vue';
import type { Browser } from 'wxt/browser';
import { findToolbarId, joinFolderPath } from '@/utils/bookmark';

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
			path: joinFolderPath(parentPath, node.title),
			parentId: node.parentId,
			children: [],
		};

		folders.push(folder);

		if (node.children && node.children.length > 0) {
			const childFolders = buildFolderTree(node.children, folder.path);

			folder.children = childFolders.filter(
				(child) => child.parentId === node.id,
			);

			folders.push(...childFolders);
		}
	}

	return folders;
};

const allFolders = ref<BookmarkFolder[]>([]);
const folderMap = ref<Map<string, BookmarkFolder>>(new Map());
const toolbarId = ref('');
let loading: Promise<void> | null = null;

const fetchFolders = async () => {
	const tree = await browser.bookmarks.getTree();
	const folders = buildFolderTree(tree);
	allFolders.value = folders.filter(
		(folder) => folder.title !== '' && folder.id !== '0',
	);
	folderMap.value = new Map(folders.map((folder) => [folder.id, folder]));
	toolbarId.value = findToolbarId(tree);
};

const loadFolders = () => {
	loading ??= fetchFolders().catch((err) => {
		loading = null;
		throw err;
	});
	return loading;
};

export function useFolderTree() {
	return { allFolders, folderMap, toolbarId, loadFolders };
}
