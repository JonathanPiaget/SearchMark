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

	let popup = await openPopup(context, extensionId, { tab: TAB });
	await popup.click('.see-later-button');

	await expect
		.poll(async () =>
			seeLaterFolders(await listBookmarks(serviceWorker, toolbarId)),
		)
		.toHaveLength(1);

	let [folder] = seeLaterFolders(await listBookmarks(serviceWorker, toolbarId));
	expect(await listBookmarks(serviceWorker, folder.id)).toHaveLength(1);

	popup = await openPopup(context, extensionId, { tab: TAB });
	await popup.click('.see-later-button');

	await expect
		.poll(async () => {
			const [reused] = seeLaterFolders(
				await listBookmarks(serviceWorker, toolbarId),
			);
			return listBookmarks(serviceWorker, reused.id).then((b) => b.length);
		})
		.toBe(2);

	expect(
		seeLaterFolders(await listBookmarks(serviceWorker, toolbarId)),
	).toHaveLength(1);

	[folder] = seeLaterFolders(await listBookmarks(serviceWorker, toolbarId));
	await removeBookmarkTree(serviceWorker, folder.id);
	expect(
		seeLaterFolders(await listBookmarks(serviceWorker, toolbarId)),
	).toHaveLength(0);

	popup = await openPopup(context, extensionId, { tab: TAB });
	await popup.click('.see-later-button');

	await expect
		.poll(async () =>
			seeLaterFolders(await listBookmarks(serviceWorker, toolbarId)),
		)
		.toHaveLength(1);

	const [recreated] = seeLaterFolders(
		await listBookmarks(serviceWorker, toolbarId),
	);
	expect(await listBookmarks(serviceWorker, recreated.id)).toHaveLength(1);
});
