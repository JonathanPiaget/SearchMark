import { expect, test } from '../fixtures';
import {
	getToolbarId,
	listBookmarks,
	openPopup,
	seedBookmarks,
} from '../helpers';

test('deleting a folder from the search view removes it with its contents', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const ids = await seedBookmarks(serviceWorker, [
		{
			folder: 'Work',
			items: [
				{ title: 'Doc A', url: 'https://example.com/a' },
				{ title: 'Doc B', url: 'https://example.com/b' },
			],
		},
	]);
	await serviceWorker.evaluate(
		(parentId) => chrome.bookmarks.create({ parentId, title: 'Sub' }),
		ids.Work,
	);

	const popup = await openPopup(context, extensionId);
	await popup.locator('.view-tabs .tab-button').nth(1).click();
	const input = popup.locator('.search-view .search-input');
	await input.fill('Work');

	const work = popup.locator('.search-view .folder-item', { hasText: 'Work' });
	await work.locator('.delete-button').click();
	await expect(popup.locator('.dialog-message')).toContainText(
		'2 bookmarks, 1 subfolder',
	);
	await popup.keyboard.press('Enter');

	await expect(work).toHaveCount(0);
	await expect(popup.locator('.search-view .scope-chip')).toHaveCount(0);
	await expect(popup.locator('.search-view .error-message')).toHaveCount(0);

	await input.fill('Doc');
	await expect(popup.locator('.search-view .bookmark-item')).toHaveCount(0);

	const toolbar = await listBookmarks(
		serviceWorker,
		await getToolbarId(serviceWorker),
	);
	expect(toolbar.map((node) => node.title)).not.toContain('Work');
});

test('browser root folders cannot be deleted', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId);
	await popup.locator('.view-tabs .tab-button').nth(1).click();
	await popup.locator('.search-view .search-input').fill('Bookmarks');

	const roots = popup.locator('.search-view .folder-item');
	await expect(roots.first()).toBeVisible();
	await expect(roots.locator('.delete-button')).toHaveCount(0);
});
