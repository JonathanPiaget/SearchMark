import { ref } from 'vue';
import { i18n } from '#i18n';
import { getBookmarkToolbarId } from '../utils/bookmark';

const STORAGE_KEY = 'searchmark_seeLaterFolder';
const seeLaterFolderId = ref<string | null>(null);
let storageListenerInitialized = false;

// Type guard for storage values
const validateStorageValue = (value: unknown): string | null => {
	return typeof value === 'string' && value.length > 0 ? value : null;
};

const loadSeeLaterFolder = async (): Promise<string | null> => {
	try {
		const result = await browser.storage.local.get(STORAGE_KEY);
		return validateStorageValue(result[STORAGE_KEY]);
	} catch (error) {
		console.warn('Failed to load See Later folder preference:', error);
		return null;
	}
};

const saveSeeLaterFolder = async (folderId: string) => {
	try {
		await browser.storage.local.set({ [STORAGE_KEY]: folderId });
	} catch (error) {
		console.error('Failed to save See Later folder:', error);
	}
};

const clearSeeLaterFolder = async () => {
	try {
		await browser.storage.local.remove(STORAGE_KEY);
		seeLaterFolderId.value = null;
	} catch (error) {
		console.error('Failed to clear See Later folder:', error);
	}
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
			console.warn('Failed to get stored folder details:', error);
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

		if (!storageListenerInitialized && browser?.storage) {
			browser.storage.onChanged.addListener((changes, areaName) => {
				if (areaName === 'local' && changes[STORAGE_KEY]) {
					seeLaterFolderId.value = validateStorageValue(
						changes[STORAGE_KEY].newValue,
					);
				}
			});
			storageListenerInitialized = true;
		}
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
