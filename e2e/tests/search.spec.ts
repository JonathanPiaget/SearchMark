import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { findTabIdByUrl, openPopup, seedBookmarks } from '../helpers';

const switchToSearch = async (popup: Page) => {
	await popup.locator('.view-tabs .tab-button').nth(1).click();
	await popup.waitForSelector('.search-view');
};

test('folder-scoped search lists subfolder items and filters within the folder', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await serviceWorker.evaluate(async () => {
		const [tree] = await chrome.bookmarks.getTree();
		const toolbarId = tree.children?.[0]?.id ?? '1';
		const work = await chrome.bookmarks.create({
			parentId: toolbarId,
			title: 'Work',
		});
		await chrome.bookmarks.create({
			parentId: work.id,
			title: 'Work Root Doc',
			url: 'https://example.com/root',
		});
		const sub = await chrome.bookmarks.create({
			parentId: work.id,
			title: 'Sub',
		});
		await chrome.bookmarks.create({
			parentId: sub.id,
			title: 'Nested Doc',
			url: 'https://example.com/nested',
		});
	});

	const popup = await openPopup(context, extensionId);
	await switchToSearch(popup);

	await popup.locator('.search-view #folder-search').fill('Work');
	await popup.waitForSelector('.search-view .dropdown-container');
	await popup
		.locator('.search-view .dropdown-item', { hasText: 'Work' })
		.first()
		.click();

	const titles = popup.locator('.search-view .bookmark-title');
	const sortedTitles = async () =>
		(await titles.allInnerTexts()).map((title) => title.trim()).sort();

	await expect.poll(sortedTitles).toEqual(['Nested Doc', 'Work Root Doc']);

	await popup.locator('.search-view .search-options .checkbox-input').uncheck();
	await expect.poll(sortedTitles).toEqual(['Work Root Doc']);

	await popup.locator('.search-view .search-options .checkbox-input').check();
	await expect.poll(sortedTitles).toEqual(['Nested Doc', 'Work Root Doc']);

	await popup
		.locator('.search-view .filter-container input[type="text"]')
		.fill('Nested');
	await expect.poll(sortedTitles).toEqual(['Nested Doc']);
});

test('global search opens a matching bookmark in a new tab', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [
		{
			folder: 'Reading',
			items: [{ title: 'Alpha Guide', url: 'https://example.com/alpha' }],
		},
	]);

	const popup = await openPopup(context, extensionId);
	await switchToSearch(popup);

	await popup
		.locator('.search-view .filter-container input[type="text"]')
		.fill('Alpha');

	await popup
		.locator('.search-view .bookmark-item', { hasText: 'Alpha Guide' })
		.click();

	await expect
		.poll(() => findTabIdByUrl(serviceWorker, 'https://example.com/alpha'))
		.not.toBeNull();
});
