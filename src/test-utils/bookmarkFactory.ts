import type { Browser } from 'wxt/browser';
import type { BookmarkFolder } from '@/composables/useFolderTree';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

/**
 * Factory for creating realistic bookmark test data
 * Mimics actual browser bookmark structure
 */

export interface CreateFolderOptions {
	id?: string;
	title: string;
	path?: string;
	parentId?: string;
	children?: BookmarkFolder[];
}

interface CreateNodeOptions {
	id?: string;
	title: string;
	url?: string;
	parentId?: string;
	children?: BookmarkTreeNode[];
}

/**
 * Creates a single BookmarkFolder (used in search results)
 */
export function createFolder(options: CreateFolderOptions): BookmarkFolder {
	return {
		id: options.id || `folder-${Math.random().toString(36).substr(2, 9)}`,
		title: options.title,
		path: options.path || '',
		parentId: options.parentId,
		children: options.children,
	};
}

/**
 * Creates a single BookmarkTreeNode (raw browser format)
 */
function createNode(options: CreateNodeOptions): BookmarkTreeNode {
	return {
		id: options.id || `node-${Math.random().toString(36).substr(2, 9)}`,
		title: options.title,
		syncing: false, // Default to not synced for test data
		url: options.url,
		parentId: options.parentId,
		children: options.children,
	};
}

/**
 * Preset: Simple tree structure for testing buildFolderTree
 */
export function createSimpleTreeNodes(): BookmarkTreeNode[] {
	return [
		createNode({ id: '1', title: 'Work', parentId: '0' }),
		createNode({ id: '2', title: 'Personal', parentId: '0' }),
		createNode({ title: 'Bookmark', url: 'https://example.com' }),
	];
}

/**
 * Preset: Nested tree structure for testing buildFolderTree
 */
export function createNestedTreeNodes(): BookmarkTreeNode[] {
	return [
		createNode({
			id: '1',
			title: 'Books',
			parentId: '0',
			children: [
				createNode({
					id: '2',
					title: 'Fiction',
					parentId: '1',
					children: [
						createNode({
							id: '3',
							title: 'Sci-Fi',
							parentId: '2',
						}),
					],
				}),
				createNode({ title: 'Book URL', url: 'https://example.com' }),
			],
		}),
	];
}
