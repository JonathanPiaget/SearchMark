import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { findTabIdByUrl, openPopup, seedBookmarks } from '../helpers';

const searchInput = (popup: Page) =>
	popup.locator('.search-view .search-input');

const switchToSearch = async (popup: Page) => {
	await popup.locator('.view-tabs .tab-button').nth(1).click();
	await popup.waitForSelector('.search-view');
};

test('a scope lists its subfolder items and narrows the search within it', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await serviceWorker.evaluate(async () => {
		const [tree] = await chrome.bookmarks.getTree();
		const toolbarId = tree?.children?.[0]?.id ?? '1';
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

	await searchInput(popup).fill('Work');
	await popup.locator('.search-view .folder-item', { hasText: 'Work' }).click();

	const titles = popup.locator('.search-view .bookmark-title');
	const sortedTitles = async () =>
		(await titles.allInnerTexts()).map((title) => title.trim()).sort();

	await expect(popup.locator('.search-view .scope-chip')).toHaveText('Work');
	await expect(searchInput(popup)).toHaveValue('');
	await expect
		.poll(sortedTitles)
		.toEqual(['Nested Doc', 'Sub', 'Work Root Doc']);

	await popup.locator('.search-view .search-options .checkbox-input').uncheck();
	await expect.poll(sortedTitles).toEqual(['Sub', 'Work Root Doc']);

	await popup.locator('.search-view .search-options .checkbox-input').check();
	await expect
		.poll(sortedTitles)
		.toEqual(['Nested Doc', 'Sub', 'Work Root Doc']);

	await searchInput(popup).fill('Nested');
	await expect.poll(sortedTitles).toEqual(['Nested Doc']);

	await searchInput(popup).fill('');
	await popup.locator('.search-view .folder-item', { hasText: 'Sub' }).click();
	await expect(popup.locator('.search-view .scope-chip')).toHaveText('Sub');
	await expect.poll(sortedTitles).toEqual(['Nested Doc']);

	await searchInput(popup).dispatchEvent('keydown', {
		key: 'Backspace',
		repeat: true,
	});
	await expect(popup.locator('.search-view .scope-chip')).toHaveText('Sub');

	await searchInput(popup).press('Backspace');
	await expect(popup.locator('.search-view .scope-chip')).toHaveCount(0);
	await expect(popup.locator('.search-view .bookmark-item')).toHaveCount(0);
});

test('search without a scope opens a matching bookmark in a new tab', async ({
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

	await searchInput(popup).fill('Alpha');

	await popup
		.locator('.search-view .bookmark-item', { hasText: 'Alpha Guide' })
		.click();

	await expect
		.poll(() => findTabIdByUrl(serviceWorker, 'https://example.com/alpha'))
		.not.toBeNull();
});

test('shows an error box instead of a blank list when bookmarks fail to load', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [
		{
			folder: 'Work',
			items: [{ title: 'Work Doc', url: 'https://example.com/doc' }],
		},
	]);

	const popup = await openPopup(context, extensionId, {
		init: () => {
			Object.defineProperty(chrome.bookmarks, 'getChildren', {
				configurable: true,
				value: () => Promise.reject(new Error('load failed')),
			});
		},
	});
	await switchToSearch(popup);

	await searchInput(popup).fill('Work');
	await popup.locator('.search-view .folder-item', { hasText: 'Work' }).click();

	await expect(popup.locator('.search-view .error-message')).toBeVisible();
	await expect(popup.locator('.search-view .bookmark-item')).toHaveCount(0);
});

test('fuzzy matching without a scope lists more than ten matches', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [
		{
			folder: 'Reading',
			items: Array.from({ length: 30 }, (_, i) => ({
				title: `Alpha Guide ${i}`,
				url: `https://example.com/alpha/${i}`,
			})),
		},
	]);

	const popup = await openPopup(context, extensionId);
	await switchToSearch(popup);

	await searchInput(popup).fill('Alpha');

	await expect(popup.locator('.search-view .bookmark-item')).toHaveCount(30);
});

test('the fuzzy button toggles typo tolerance', async ({
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
	const fuzzyButton = popup.locator('.search-view .fuzzy-button');
	await expect(fuzzyButton).toHaveAttribute('aria-pressed', 'true');

	await searchInput(popup).fill('alhpa');
	await expect(popup.locator('.search-view .bookmark-item')).toHaveCount(1);

	await fuzzyButton.click();
	await expect(fuzzyButton).toHaveAttribute('aria-pressed', 'false');
	await expect(popup.locator('.search-view .bookmark-item')).toHaveCount(0);
});
