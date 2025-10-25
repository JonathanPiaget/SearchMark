import type {
	BookmarkFolder,
	BookmarkNode,
} from '../composables/useFolderTree';

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

export interface CreateNodeOptions {
	id?: string;
	title: string;
	url?: string;
	parentId?: string;
	children?: BookmarkNode[];
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
 * Creates a single BookmarkNode (raw browser format)
 */
export function createNode(options: CreateNodeOptions): BookmarkNode {
	return {
		id: options.id || `node-${Math.random().toString(36).substr(2, 9)}`,
		title: options.title,
		url: options.url,
		parentId: options.parentId,
		children: options.children,
	};
}

/**
 * Creates an array of folders matching a common pattern
 * Useful for testing search with many results
 */
export function createFolders(
	count: number,
	prefix = 'Folder',
): BookmarkFolder[] {
	const folders: BookmarkFolder[] = [];
	for (let i = 0; i < count; i++) {
		folders.push(createFolder({ title: `${prefix} ${i}` }));
	}
	return folders;
}

/**
 * Preset: Realistic work-related bookmark structure
 */
export function createWorkBookmarks(): BookmarkFolder[] {
	return [
		createFolder({ id: '1', title: 'Work Projects', path: '' }),
		createFolder({ id: '2', title: 'Documentation', path: 'Work Projects' }),
		createFolder({ id: '3', title: 'Code Reviews', path: 'Work Projects' }),
		createFolder({ id: '4', title: 'Personal', path: '' }),
		createFolder({ id: '5', title: 'work notes', path: 'Personal' }),
	];
}

/**
 * Preset: Folders with special characters (tests regex escaping)
 */
export function createSpecialCharFolders(): BookmarkFolder[] {
	return [
		createFolder({ title: 'Price: $100 (USD)' }),
		createFolder({ title: 'Regex [.*+?^$' + '{}]' }), // Split to avoid template warning
		createFolder({ title: 'Normal Folder' }),
		createFolder({ title: 'Path/To/Files' }),
	];
}

/**
 * Preset: Multilingual folders (tests unicode and case-insensitive search)
 */
export function createMultilingualFolders(): BookmarkFolder[] {
	return [
		createFolder({ title: 'Développement' }),
		createFolder({ title: 'DÉVELOPPEMENT' }),
		createFolder({ title: '日本語ブックマーク' }),
		createFolder({ title: 'Español Favoritos' }),
		createFolder({ title: 'Development' }),
	];
}

/**
 * Preset: Nested folder structure (tests hierarchy and path)
 */
export function createNestedFolders(): BookmarkFolder[] {
	return [
		createFolder({
			id: '1',
			title: 'Books',
			path: '',
			children: [
				createFolder({
					id: '2',
					title: 'Fiction',
					path: 'Books',
					parentId: '1',
				}),
				createFolder({
					id: '3',
					title: 'Non-Fiction',
					path: 'Books',
					parentId: '1',
				}),
			],
		}),
		createFolder({ id: '2', title: 'Fiction', path: 'Books', parentId: '1' }),
		createFolder({
			id: '3',
			title: 'Non-Fiction',
			path: 'Books',
			parentId: '1',
		}),
		createFolder({
			id: '4',
			title: 'Sci-Fi',
			path: 'Books > Fiction',
			parentId: '2',
		}),
	];
}

/**
 * Preset: Empty/minimal folders (edge cases)
 */
export function createEdgeCaseFolders(): BookmarkFolder[] {
	return [
		createFolder({ title: '' }), // Empty title
		createFolder({ title: ' ' }), // Whitespace only
		createFolder({ title: 'A' }), // Single character
		createFolder({ title: 'a' }), // Lowercase single char
	];
}
