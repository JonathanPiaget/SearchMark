import { i18n } from '#i18n';
import { getBookmarkToolbarId } from '@/utils/bookmark';
import { getCurrentTab } from '@/utils/tabs';

const seeLaterFolderItem = storage.defineItem<string | null>(
	'local:searchmark_seeLaterFolder',
	{ fallback: null },
);

const asFolderId = (value: unknown): string | null =>
	typeof value === 'string' && value.length > 0 ? value : null;

const getStoredFolder = async () => {
	const id = asFolderId(await seeLaterFolderItem.getValue());
	if (!id) return null;
	const folder = await browser.bookmarks.get(id).then(
		([node]) => node ?? null,
		() => null,
	);
	if (!folder) await seeLaterFolderItem.removeValue();
	return folder;
};

export const getSeeLaterFolderId = async (): Promise<string | null> =>
	(await getStoredFolder())?.id ?? null;

export const setSeeLaterFolderId = async (id: string | null) => {
	if (id) {
		await seeLaterFolderItem.setValue(id);
	} else {
		await seeLaterFolderItem.removeValue();
	}
};

export const watchSeeLaterFolderId = (
	callback: (id: string | null) => void,
): (() => void) =>
	seeLaterFolderItem.watch((value) => callback(asFolderId(value)));

const findExistingSeeLaterFolder = async () => {
	const titles = [...new Set([i18n.t('seeLater'), 'See Later'])];
	for (const title of titles) {
		const matches = await browser.bookmarks.search({ title });
		const folder = matches.find((match) => !match.url);
		if (folder) return folder;
	}
	return null;
};

export const getOrCreateSeeLaterFolder = async (): Promise<{
	id: string;
	title: string;
}> => {
	const stored = await getStoredFolder();
	if (stored) {
		return { id: stored.id, title: stored.title || 'See Later' };
	}

	const existing = await findExistingSeeLaterFolder();
	if (existing) {
		await setSeeLaterFolderId(existing.id);
		return { id: existing.id, title: existing.title || 'See Later' };
	}

	const folder = await browser.bookmarks.create({
		parentId: await getBookmarkToolbarId(),
		title: i18n.t('seeLater'),
	});
	await setSeeLaterFolderId(folder.id);
	return { id: folder.id, title: folder.title || 'See Later' };
};

export const quickSave = async (): Promise<{ folderTitle: string }> => {
	const tab = await getCurrentTab();
	const folder = await getOrCreateSeeLaterFolder();
	await browser.bookmarks.create({
		title: tab.title,
		url: tab.url,
		parentId: folder.id,
	});
	return { folderTitle: folder.title };
};
