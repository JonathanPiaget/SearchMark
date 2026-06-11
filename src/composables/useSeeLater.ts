import { ref } from 'vue';
import { i18n } from '#i18n';
import { getBookmarkToolbarId } from '@/utils/bookmark';
import { logError } from '@/utils/logger';

const seeLaterFolderItem = storage.defineItem<string | null>(
	'local:searchmark_seeLaterFolder',
	{ fallback: null },
);

const seeLaterFolderId = ref<string | null>(null);

// Type guard for storage values
const validateStorageValue = (value: unknown): string | null => {
	return typeof value === 'string' && value.length > 0 ? value : null;
};

const loadSeeLaterFolder = async (): Promise<string | null> => {
	return validateStorageValue(await seeLaterFolderItem.getValue());
};

const saveSeeLaterFolder = async (folderId: string) => {
	await seeLaterFolderItem.setValue(folderId);
};

const clearSeeLaterFolder = async () => {
	await seeLaterFolderItem.removeValue();
	seeLaterFolderId.value = null;
};

const verifyFolderExists = async (folderId: string): Promise<boolean> => {
	try {
		await browser.bookmarks.get(folderId);
		return true;
	} catch {
		return false;
	}
};

const getOrCreateSeeLaterFolder = async (): Promise<{
	id: string;
	title: string;
}> => {
	// First, check if user has selected a folder in settings
	const stored = await loadSeeLaterFolder();
	if (stored && (await verifyFolderExists(stored))) {
		try {
			const folders = await browser.bookmarks.get(stored);
			if (folders[0]) {
				seeLaterFolderId.value = stored;
				return { id: folders[0].id, title: folders[0].title || 'See Later' };
			}
		} catch (error) {
			logError('Failed to get stored folder details', error);
		}
	}

	// Clear invalid stored folder ID
	if (stored) await clearSeeLaterFolder();

	// Create new folder in bookmark toolbar as fallback
	const toolbarId = await getBookmarkToolbarId();
	const folder = await browser.bookmarks.create({
		parentId: toolbarId,
		title: i18n.t('seeLater'),
	});

	await saveSeeLaterFolder(folder.id);
	seeLaterFolderId.value = folder.id;
	return { id: folder.id, title: folder.title || 'See Later' };
};

export const useSeeLater = () => {
	const initSeeLater = async () => {
		const saved = await loadSeeLaterFolder();
		if (saved && (await verifyFolderExists(saved))) {
			seeLaterFolderId.value = saved;
		} else if (saved) {
			await clearSeeLaterFolder();
		}

		seeLaterFolderItem.watch((newValue) => {
			seeLaterFolderId.value = validateStorageValue(newValue);
		});
	};

	return {
		seeLaterFolderId,
		initSeeLater,
		loadSeeLaterFolder,
		saveSeeLaterFolder,
		clearSeeLaterFolder,
		getOrCreateSeeLaterFolder,
	};
};
