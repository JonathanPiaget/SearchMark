import { ref } from 'vue';
import { i18n } from '@/utils/i18n';
import { logError } from '@/utils/logger';
import { notify } from '@/utils/notify';

interface TreeNode {
	url?: string;
	children?: TreeNode[];
}

export interface FolderContents {
	bookmarks: number;
	folders: number;
}

export const countDescendants = (node: TreeNode): FolderContents => {
	const counts = { bookmarks: 0, folders: 0 };
	for (const child of node.children ?? []) {
		if (child.url) {
			counts.bookmarks += 1;
			continue;
		}
		const nested = countDescendants(child);
		counts.bookmarks += nested.bookmarks;
		counts.folders += nested.folders + 1;
	}
	return counts;
};

export const countFolderContents = async (
	id: string,
): Promise<FolderContents> => {
	const [folder] = await browser.bookmarks.getSubTree(id);
	if (!folder) throw new Error(`Folder ${id} not found`);
	return countDescendants(folder);
};

export function useBookmarkActions() {
	const isDeleting = ref(false);
	const deleteError = ref<string | null>(null);

	const runDeletion = async (
		id: string,
		remove: (id: string) => Promise<void>,
		doneMessage: string,
	): Promise<void> => {
		isDeleting.value = true;
		deleteError.value = null;

		try {
			await remove(id);

			notify(doneMessage);
		} catch (error) {
			logError(`Failed to delete bookmark node with ID ${id}`, error);
			deleteError.value = i18n.t('bookmarkError');
			throw error;
		} finally {
			isDeleting.value = false;
		}
	};

	const deleteBookmark = (id: string) =>
		runDeletion(
			id,
			(nodeId) => browser.bookmarks.remove(nodeId),
			i18n.t('bookmarkDeleted'),
		);

	const deleteFolder = (id: string) =>
		runDeletion(
			id,
			(nodeId) => browser.bookmarks.removeTree(nodeId),
			i18n.t('folderDeleted'),
		);

	return {
		isDeleting,
		deleteError,
		deleteBookmark,
		deleteFolder,
	};
}
