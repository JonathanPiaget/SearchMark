import { expect, test } from './fixtures';
import { listBookmarks, openPopup, seedBookmarks } from './helpers';

const TAB = { url: 'https://example.com/article', title: 'Example Article' };

test('saves the current page into the chosen folder', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const ids = await seedBookmarks(serviceWorker, [
		{ folder: 'Work' },
		{ folder: 'Reading' },
		{ folder: 'Recipes' },
	]);

	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#folder-search', 'Reading');
	await popup.waitForSelector('.dropdown-container');
	await popup.locator('.dropdown-item', { hasText: 'Reading' }).first().click();

	await popup.click('.save-button');

	await expect
		.poll(async () => {
			const children = await listBookmarks(serviceWorker, ids.Reading);
			return children.map((bookmark) => bookmark.url);
		})
		.toContain(TAB.url);
});
