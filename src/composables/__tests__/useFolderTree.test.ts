import { describe, expect, it } from 'vitest';
import {
	createNestedTreeNodes,
	createSimpleTreeNodes,
} from '../../test-utils/bookmarkFactory';
import { buildFolderTree } from '../useFolderTree';

describe('buildFolderTree', () => {
	it('filters out bookmarks and returns only folders', () => {
		const nodes = createSimpleTreeNodes();

		const tree = buildFolderTree(nodes);

		expect(tree).toHaveLength(2);
		expect(tree[0].title).toBe('Work');
		expect(tree[1].title).toBe('Personal');
	});

	it('sets empty path for root-level folders', () => {
		const nodes = createSimpleTreeNodes();

		const tree = buildFolderTree(nodes);

		expect(tree[0].path).toBe('');
		expect(tree[1].path).toBe('');
	});

	it('builds hierarchical paths using " > " separator', () => {
		const nodes = createNestedTreeNodes();

		const tree = buildFolderTree(nodes);

		expect(tree.find((f) => f.id === '1')?.path).toBe('');
		expect(tree.find((f) => f.id === '2')?.path).toBe('Books');
		expect(tree.find((f) => f.id === '3')?.path).toBe('Books > Fiction');
	});

	it('assigns children array to parent folders', () => {
		const nodes = createNestedTreeNodes();

		const tree = buildFolderTree(nodes);
		const books = tree.find((f) => f.id === '1');
		const fiction = tree.find((f) => f.id === '2');

		expect(books?.children).toHaveLength(1);
		expect(books?.children?.[0].id).toBe('2');
		expect(fiction?.children).toHaveLength(1);
		expect(fiction?.children?.[0].id).toBe('3');
	});

	it('flattens all folders into a single array', () => {
		const nodes = createNestedTreeNodes();

		const tree = buildFolderTree(nodes);

		// Books + Fiction + Sci-Fi = 3 folders
		expect(tree).toHaveLength(3);
		expect(tree.map((f) => f.title)).toEqual(['Books', 'Fiction', 'Sci-Fi']);
	});
});
