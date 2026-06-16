import { expect, test } from './fixtures';
import {
	getToolbarId,
	listBookmarks,
	openPopup,
	removeBookmarkTree,
} from './helpers';

const TAB = { url: 'https://example.org/page', title: 'Example Page' };
const SEE_LATER = 'See Later';

const seeLaterFolders = (children: ChromeBookmarkNode[]) =>
	children.filter((child) => !child.url && child.title === SEE_LATER);

test('creates, reuses, then recreates the See Later folder', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const toolbarId = await getToolbarId(serviceWorker);

	const childCounts = async () => {
		const folders = seeLaterFolders(
			await listBookmarks(serviceWorker, toolbarId),
		);
		return Promise.all(
			folders.map((folder) =>
				listBookmarks(serviceWorker, folder.id).then((items) => items.length),
			),
		);
	};

	const clickSeeLater = async () => {
		const popup = await openPopup(context, extensionId, { tab: TAB });
		await popup.click('.see-later-button');
	};

	await clickSeeLater();
	await expect.poll(childCounts).toEqual([1]);

	await clickSeeLater();
	await expect.poll(childCounts).toEqual([2]);

	const [stale] = seeLaterFolders(
		await listBookmarks(serviceWorker, toolbarId),
	);
	await removeBookmarkTree(serviceWorker, stale.id);
	await expect.poll(childCounts).toEqual([]);

	await clickSeeLater();
	await expect.poll(childCounts).toEqual([1]);
});
