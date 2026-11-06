import type { Page, Worker } from '@playwright/test';
import { expect, test } from '../fixtures';
import {
	getToolbarId,
	listBookmarks,
	openPopup,
	seedBookmarks,
} from '../helpers';

const TAB = { url: 'https://example.com/tart', title: 'Apple Tart' };

const toolbarFolder = async (serviceWorker: Worker, title: string) => {
	const children = await listBookmarks(
		serviceWorker,
		await getToolbarId(serviceWorker),
	);
	return children.find((node) => !node.url && node.title === title);
};

const savedUrlsIn = async (serviceWorker: Worker, title: string) => {
	const folder = await toolbarFolder(serviceWorker, title);
	if (!folder) return null;
	const children = await listBookmarks(serviceWorker, folder.id);
	return children.map((node) => node.url);
};

// Enter saves and closes the popup, which can end the page before press resolves.
const pressEnterToSave = (popup: Page) =>
	popup.press('#folder-search', 'Enter').catch((error) => {
		if (!popup.isClosed()) throw error;
	});

const expectPendingField = async (popup: Page, title: string) => {
	await expect(popup.locator('#folder-search')).toHaveValue(title);
	await expect(popup.locator('.pending-badge')).toBeVisible();
	await expect(popup.locator('.pending-parent')).toContainText(
		'Bookmark toolbar',
	);
	await expect(popup.locator('.dropdown-container')).toBeHidden();
};

test('the footer button stages a pending folder that is created on save', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [{ folder: 'Tarts and pies' }]);
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#folder-search', 'Tarts');
	await popup.locator('.create-folder-button').click();

	await expectPendingField(popup, 'Tarts');
	expect(await toolbarFolder(serviceWorker, 'Tarts')).toBeUndefined();

	await popup.click('.save-button');

	await expect
		.poll(() => savedUrlsIn(serviceWorker, 'Tarts'))
		.toEqual([TAB.url]);
});

test('Enter with no match stages a pending folder, a second Enter saves into it', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [{ folder: 'Work' }]);
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#folder-search', 'Quiches');
	await expect(popup.locator('.no-results')).toContainText('Quiches');
	await popup.press('#folder-search', 'Enter');

	await expectPendingField(popup, 'Quiches');

	await pressEnterToSave(popup);

	await expect
		.poll(() => savedUrlsIn(serviceWorker, 'Quiches'))
		.toEqual([TAB.url]);
});

test('Shift+Enter is not offered for a title already in the bookmark toolbar', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [{ folder: 'Recipes' }]);
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#folder-search', 'recipes');
	await expect(
		popup.locator('.dropdown-item', { hasText: 'Recipes' }),
	).toBeVisible();

	await expect(popup.locator('.create-folder-button')).toBeHidden();

	await popup.press('#folder-search', 'Shift+Enter');

	await expect(popup.locator('.dropdown-container')).toBeVisible();
	await expect(popup.locator('.pending-badge')).toBeHidden();
	await expect(popup.locator('#folder-search')).toHaveValue('recipes');
});

test('a retry after the bookmark fails reuses the folder already created', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId, {
		tab: TAB,
		init: () => {
			const create = chrome.bookmarks.create.bind(chrome.bookmarks);
			let failNextBookmark = true;
			Object.defineProperty(chrome.bookmarks, 'create', {
				configurable: true,
				value: (details: ChromeBookmarkCreate) => {
					if (details.url && failNextBookmark) {
						failNextBookmark = false;
						return Promise.reject(new Error('create failed'));
					}
					return create(details);
				},
			});
		},
	});

	await popup.fill('#folder-search', 'Tarts');
	await popup.press('#folder-search', 'Enter');
	await popup.click('.save-button');
	await expect(popup.locator('.save-view .message.error')).toBeVisible();
	await expect(popup.locator('.pending-badge')).toBeHidden();
	await expect(popup.locator('#folder-search')).toHaveValue('Tarts');

	await popup.click('.save-button');

	await expect
		.poll(() => savedUrlsIn(serviceWorker, 'Tarts'))
		.toEqual([TAB.url]);
	const toolbar = await listBookmarks(
		serviceWorker,
		await getToolbarId(serviceWorker),
	);
	expect(toolbar.filter((node) => node.title === 'Tarts')).toHaveLength(1);
});

test('"/" scopes the picker to a folder and Shift+Enter creates inside it', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const ids = await seedBookmarks(serviceWorker, [
		{ folder: 'Kitchen' },
		{ folder: 'Garden' },
	]);
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#folder-search', 'Kitch');
	await popup.press('#folder-search', '/');

	await expect(popup.locator('.scope-chip')).toHaveText(/Kitchen\s*\//);
	await expect(popup.locator('#folder-search')).toHaveValue('');
	await expect(popup.locator('.dropdown-header')).toContainText(
		'leave Kitchen',
	);
	await expect(popup.locator('.no-results')).toContainText(
		'This folder is empty',
	);

	await popup.fill('#folder-search', 'Tarts');
	await popup.press('#folder-search', 'Shift+Enter');

	await expect(popup.locator('.scope-chip')).toBeHidden();
	await expect(popup.locator('.pending-parent')).toContainText('Kitchen');

	await popup.click('.save-button');

	await expect
		.poll(async () => {
			const kitchen = await listBookmarks(serviceWorker, ids.Kitchen ?? '');
			const tarts = kitchen.find((node) => node.title === 'Tarts');
			return tarts && (await listBookmarks(serviceWorker, tarts.id));
		})
		.toMatchObject([{ url: TAB.url }]);
});

test('Backspace on the empty input leaves the scope', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await seedBookmarks(serviceWorker, [{ folder: 'Kitchen' }]);
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#folder-search', 'Kitch');
	await popup.press('#folder-search', '/');
	await expect(popup.locator('.scope-chip')).toBeVisible();

	await popup.press('#folder-search', 'Backspace');

	await expect(popup.locator('.scope-chip')).toBeHidden();
	await expect(popup.locator('.dropdown-container')).toBeHidden();
});

test('an empty input inside a scope lists its subfolders and Enter saves into the scope', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const ids = await seedBookmarks(serviceWorker, [{ folder: 'Kitchen' }]);
	await serviceWorker.evaluate(
		(parentId) => chrome.bookmarks.create({ parentId, title: 'Desserts' }),
		ids.Kitchen ?? '',
	);
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#folder-search', 'Kitch');
	await popup.press('#folder-search', '/');

	await expect(
		popup.locator('.dropdown-item', { hasText: 'Desserts' }),
	).toBeVisible();
	await expect(popup.locator('.dropdown-item.highlighted')).toHaveCount(0);

	await pressEnterToSave(popup);

	await expect
		.poll(async () =>
			(await listBookmarks(serviceWorker, ids.Kitchen ?? '')).map((n) => n.url),
		)
		.toContain(TAB.url);
});
