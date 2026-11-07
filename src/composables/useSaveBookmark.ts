import { ref } from 'vue';
import type { PendingFolder } from '@/composables/useFolderPicker';
import { useFolderTree } from '@/composables/useFolderTree';
import { i18n } from '@/utils/i18n';
import { notify } from '@/utils/notify';

export function useSaveBookmark() {
	const { toolbarId, loadFolders, refreshFolders } = useFolderTree();
	const selectedFolderId = ref('');
	const selectedFolderName = ref('');
	const pendingFolder = ref<PendingFolder | null>(null);

	const save = async (bookmark: { title: string; url: string }) => {
		await loadFolders();
		const pending = pendingFolder.value;
		if (pending) {
			// Firefox rejects Vue reactive proxies at the WebExtension API boundary
			const folder = await browser.bookmarks.create({ ...pending });
			// a retry after the bookmark fails must reuse this folder, not create a second one
			pendingFolder.value = null;
			await refreshFolders();
			selectedFolderId.value = folder.id;
			selectedFolderName.value = folder.title;
		}

		await browser.bookmarks.create({
			...bookmark,
			parentId: selectedFolderId.value || toolbarId.value,
		});

		notify(
			pending
				? i18n.t('bookmarkSavedInNewFolder', { folderName: pending.title })
				: selectedFolderName.value
					? i18n.t('bookmarkSavedInFolder', {
							folderName: selectedFolderName.value,
						})
					: i18n.t('bookmarkSaved'),
		);
	};

	return { selectedFolderId, selectedFolderName, pendingFolder, save };
}
