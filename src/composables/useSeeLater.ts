import { ref } from 'vue';
import {
	clearSeeLaterFolder as clearStoredFolder,
	getOrCreateSeeLaterFolder as getOrCreateFolder,
	loadSeeLaterFolder,
	saveSeeLaterFolder,
	seeLaterFolderItem,
	validateStorageValue,
	verifyFolderExists,
} from '@/utils/seeLater';

const seeLaterFolderId = ref<string | null>(null);

const clearSeeLaterFolder = async () => {
	await clearStoredFolder();
	seeLaterFolderId.value = null;
};

const getOrCreateSeeLaterFolder = async () => {
	const folder = await getOrCreateFolder();
	seeLaterFolderId.value = folder.id;
	return folder;
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
