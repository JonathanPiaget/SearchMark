import { getOrCreateSeeLaterFolder } from '@/utils/seeLater';

export const quickSaveCurrentTab = async (): Promise<{
	folderTitle: string;
}> => {
	const [tab] = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	if (!tab?.url) {
		throw new Error('No active tab to save');
	}

	const folder = await getOrCreateSeeLaterFolder();
	await browser.bookmarks.create({
		title: tab.title || tab.url,
		url: tab.url,
		parentId: folder.id,
	});

	return { folderTitle: folder.title };
};
