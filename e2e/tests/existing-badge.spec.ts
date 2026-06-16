import { expect, test } from '../fixtures';
import {
	findTabIdByUrl,
	getBadgeText,
	openPopup,
	openTab,
	seedBookmarks,
} from '../helpers';

const URL = 'https://example.com/saved';

test('deleting from "Already saved in" clears the list and the badge', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [
		{ folder: 'Reading', items: [{ title: 'Saved Page', url: URL }] },
	]);

	await openTab(context, URL);

	const tabId = await findTabIdByUrl(serviceWorker, URL);
	expect(tabId).not.toBeNull();
	await expect
		.poll(() => getBadgeText(serviceWorker, tabId as number))
		.toBe('✓');

	const popup = await openPopup(context, extensionId, {
		tab: { url: URL, title: 'Saved Page' },
	});
	await popup.waitForSelector('.existing-bookmarks .location-item');
	expect(await popup.locator('.location-item').count()).toBe(1);

	await popup.click('.location-item .delete-button');
	await popup.click('.confirm-button');

	await expect(popup.locator('.location-item')).toHaveCount(0);
	await expect
		.poll(() => getBadgeText(serviceWorker, tabId as number))
		.toBe('');
});
