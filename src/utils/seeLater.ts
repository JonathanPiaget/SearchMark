import { i18n } from '#i18n';
import { getBookmarkToolbarId } from '@/utils/bookmark';
import { logError } from '@/utils/logger';

export const seeLaterFolderItem = storage.defineItem<string | null>(
	'local:searchmark_seeLaterFolder',
	{ fallback: null },
);

export const validateStorageValue = (value: unknown): string | null => {
	return typeof value === 'string' && value.length > 0 ? value : null;
};

export const loadSeeLaterFolder = async (): Promise<string | null> => {
	return validateStorageValue(await seeLaterFolderItem.getValue());
};

export const saveSeeLaterFolder = async (folderId: string) => {
	await seeLaterFolderItem.setValue(folderId);
};

export const clearSeeLaterFolder = async () => {
	await seeLaterFolderItem.removeValue();
};

export const verifyFolderExists = async (
	folderId: string,
): Promise<boolean> => {
	try {
		await browser.bookmarks.get(folderId);
		return true;
	} catch {
		return false;
	}
};

export const getOrCreateSeeLaterFolder = async (): Promise<{
	id: string;
	title: string;
}> => {
	const stored = await loadSeeLaterFolder();
	if (stored && (await verifyFolderExists(stored))) {
		try {
			const folders = await browser.bookmarks.get(stored);
			if (folders[0]) {
				return { id: folders[0].id, title: folders[0].title || 'See Later' };
			}
		} catch (error) {
			logError('Failed to get stored folder details', error);
		}
	}

	if (stored) await clearSeeLaterFolder();

	const toolbarId = await getBookmarkToolbarId();
	const folder = await browser.bookmarks.create({
		parentId: toolbarId,
		title: i18n.t('seeLater'),
	});

	await saveSeeLaterFolder(folder.id);
	return { id: folder.id, title: folder.title || 'See Later' };
};
