import type { Page, Worker } from '@playwright/test';
import { expect, test } from '../fixtures';
import { openPopup, seedBookmarks } from '../helpers';

const seedWork = (serviceWorker: Worker, count: number) =>
	seedBookmarks(serviceWorker, [
		{
			folder: 'Work',
			items: Array.from({ length: count }, (_, i) => ({
				title: `Doc ${i}`,
				url: `https://example.com/doc/${i}`,
			})),
		},
	]);

const scopeToWork = async (popup: Page) => {
	await popup.locator('.view-tabs .tab-button').nth(1).click();
	await popup.locator('.search-view .search-input').fill('Work');
	await popup.locator('.search-view .folder-item', { hasText: 'Work' }).click();
};

const docTabUrls = (serviceWorker: Worker) =>
	serviceWorker.evaluate(async () => {
		const tabs = await chrome.tabs.query({});
		return tabs
			.map((tab) => tab.pendingUrl || tab.url || '')
			.filter((url) => url.includes('/doc/'));
	});

test('open all opens every bookmark of the scope in list order, folders left out', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const ids = await seedWork(serviceWorker, 3);
	await serviceWorker.evaluate(
		(parentId) => chrome.bookmarks.create({ parentId, title: 'Sub' }),
		ids.Work,
	);

	const popup = await openPopup(context, extensionId);
	await scopeToWork(popup);
	await popup.getByRole('button', { name: 'Open all (3)' }).click();

	await expect
		.poll(() => docTabUrls(serviceWorker))
		.toEqual([0, 1, 2].map((i) => `https://example.com/doc/${i}`));
	await expect(popup.locator('.dialog-container')).toHaveCount(0);
});

test('open all opens each bookmark once on a double click', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedWork(serviceWorker, 3);

	const popup = await openPopup(context, extensionId);
	await scopeToWork(popup);
	await popup.getByRole('button', { name: 'Open all (3)' }).dblclick();

	await expect
		.poll(() => docTabUrls(serviceWorker))
		.toEqual([0, 1, 2].map((i) => `https://example.com/doc/${i}`));
});

test('open all asks before opening 15 tabs and opens nothing on cancel', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedWork(serviceWorker, 15);

	const popup = await openPopup(context, extensionId);
	await scopeToWork(popup);
	await popup.getByRole('button', { name: 'Open all (15)' }).click();

	const dialog = popup.locator('.dialog-container');
	await expect(dialog).toContainText('Open 15 tabs?');
	await expect(dialog.locator('.confirm-button')).toContainText('Open');
	await dialog.locator('.cancel-button').click();

	await expect(dialog).toHaveCount(0);
	expect(await docTabUrls(serviceWorker)).toEqual([]);
});
