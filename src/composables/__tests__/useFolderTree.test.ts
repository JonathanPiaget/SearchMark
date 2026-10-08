import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { buildFolderTree, useFolderTree } from '@/composables/useFolderTree';
import {
	createNestedTreeNodes,
	createSimpleTreeNodes,
} from '@/test-utils/bookmarkFactory';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

const bookmarks = browser.bookmarks as unknown as {
	getTree(): Promise<BookmarkTreeNode[]>;
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('buildFolderTree', () => {
	it('filters out bookmarks and returns only folders', () => {
		const nodes = createSimpleTreeNodes();

		const tree = buildFolderTree(nodes);

		expect(tree).toHaveLength(2);
		expect(tree[0]?.title).toBe('Work');
		expect(tree[1]?.title).toBe('Personal');
	});

	it('uses the title as path for root-level folders', () => {
		const nodes = createSimpleTreeNodes();

		const tree = buildFolderTree(nodes);

		expect(tree[0]?.path).toBe('Work');
		expect(tree[1]?.path).toBe('Personal');
	});

	it('builds paths including the folder itself using " > "', () => {
		const nodes = createNestedTreeNodes();

		const tree = buildFolderTree(nodes);

		expect(tree.find((f) => f.id === '1')?.path).toBe('Books');
		expect(tree.find((f) => f.id === '2')?.path).toBe('Books > Fiction');
		expect(tree.find((f) => f.id === '3')?.path).toBe(
			'Books > Fiction > Sci-Fi',
		);
	});

	it('assigns children array to parent folders', () => {
		const nodes = createNestedTreeNodes();

		const tree = buildFolderTree(nodes);
		const books = tree.find((f) => f.id === '1');
		const fiction = tree.find((f) => f.id === '2');

		expect(books?.children).toHaveLength(1);
		expect(books?.children?.[0]?.id).toBe('2');
		expect(fiction?.children).toHaveLength(1);
		expect(fiction?.children?.[0]?.id).toBe('3');
	});

	it('flattens all folders into a single array', () => {
		const nodes = createNestedTreeNodes();

		const tree = buildFolderTree(nodes);

		// Books + Fiction + Sci-Fi = 3 folders
		expect(tree).toHaveLength(3);
		expect(tree.map((f) => f.title)).toEqual(['Books', 'Fiction', 'Sci-Fi']);
	});
});

describe('useFolderTree', () => {
	it('fetches the tree once, retrying only after a failure', async () => {
		const getTree = vi
			.spyOn(bookmarks, 'getTree')
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValue([
				{
					id: '0',
					title: '',
					children: [
						{ id: 'toolbar', title: 'Toolbar', parentId: '0' },
						...createNestedTreeNodes(),
					],
				},
			] as BookmarkTreeNode[]);
		const { loadFolders, allFolders, folderMap, toolbarId } = useFolderTree();

		await expect(loadFolders()).rejects.toThrow('boom');
		await Promise.all([loadFolders(), loadFolders()]);
		await loadFolders();

		expect(getTree).toHaveBeenCalledTimes(2);
		expect(allFolders.value.map((f) => f.id)).toEqual([
			'toolbar',
			'1',
			'2',
			'3',
		]);
		expect(folderMap.value.get('3')?.path).toBe('Books > Fiction > Sci-Fi');
		expect(toolbarId.value).toBe('toolbar');
	});
});
