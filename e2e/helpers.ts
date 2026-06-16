import type { BrowserContext, Page, Worker } from '@playwright/test';

export interface SeedFolder {
	folder: string;
	items?: { title: string; url: string }[];
}

export interface SeedTab {
	url: string;
	title: string;
}

export function getToolbarId(serviceWorker: Worker): Promise<string> {
	return serviceWorker.evaluate(async () => {
		const [tree] = await chrome.bookmarks.getTree();
		return tree.children?.[0]?.id ?? '1';
	});
}

export function seedBookmarks(
	serviceWorker: Worker,
	folders: SeedFolder[],
): Promise<Record<string, string>> {
	return serviceWorker.evaluate(async (folders) => {
		const [tree] = await chrome.bookmarks.getTree();
		const toolbarId = tree.children?.[0]?.id ?? '1';
		const ids: Record<string, string> = {};
		for (const { folder, items } of folders) {
			const created = await chrome.bookmarks.create({
				parentId: toolbarId,
				title: folder,
			});
			ids[folder] = created.id;
			for (const { title, url } of items ?? []) {
				await chrome.bookmarks.create({ parentId: created.id, title, url });
			}
		}
		return ids;
	}, folders);
}

export function listBookmarks(
	serviceWorker: Worker,
	parentId: string,
): Promise<ChromeBookmarkNode[]> {
	return serviceWorker.evaluate(
		(id) => chrome.bookmarks.getChildren(id),
		parentId,
	);
}

export function removeBookmarkTree(
	serviceWorker: Worker,
	id: string,
): Promise<void> {
	return serviceWorker.evaluate((id) => chrome.bookmarks.removeTree(id), id);
}

export function setStorage(
	serviceWorker: Worker,
	key: string,
	value: unknown,
): Promise<void> {
	return serviceWorker.evaluate(
		({ key, value }) => chrome.storage.local.set({ [key]: value }),
		{ key, value },
	);
}

export function getStorage(
	serviceWorker: Worker,
	key: string,
): Promise<unknown> {
	return serviceWorker.evaluate(
		(key) => chrome.storage.local.get(key).then((result) => result[key]),
		key,
	);
}

export function getBadgeText(
	serviceWorker: Worker,
	tabId: number,
): Promise<string> {
	return serviceWorker.evaluate(
		(tabId) => chrome.action.getBadgeText({ tabId }),
		tabId,
	);
}

export function findTabIdByUrl(
	serviceWorker: Worker,
	url: string,
): Promise<number | null> {
	return serviceWorker.evaluate(async (url) => {
		const tabs = await chrome.tabs.query({});
		return tabs.find((tab) => tab.url === url)?.id ?? null;
	}, url);
}

export async function openPopup(
	context: BrowserContext,
	extensionId: string,
	options: { tab?: SeedTab; init?: () => void } = {},
): Promise<Page> {
	const page = await context.newPage();
	if (options.tab) {
		await page.addInitScript((tab) => {
			const fakeTabs = [{ id: 1, active: true, ...tab }];
			Object.defineProperty(chrome.tabs, 'query', {
				configurable: true,
				value: () => Promise.resolve(fakeTabs),
			});
		}, options.tab);
	}
	if (options.init) {
		await page.addInitScript(options.init);
	}
	await page.goto(`chrome-extension://${extensionId}/popup.html`);
	await page.waitForSelector('.container');
	return page;
}

export async function openSettings(
	context: BrowserContext,
	extensionId: string,
): Promise<Page> {
	const page = await context.newPage();
	await page.goto(`chrome-extension://${extensionId}/settings.html`);
	await page.waitForSelector('.settings-container');
	return page;
}

export async function openTab(
	context: BrowserContext,
	url: string,
): Promise<Page> {
	const page = await context.newPage();
	await page.route('**/*', (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: '<!doctype html><title>e2e tab</title>',
		}),
	);
	await page.goto(url);
	return page;
}
