import { expect, test } from '../fixtures';
import {
	findTabIdByUrl,
	getBadgeText,
	openTab,
	seedBookmarks,
} from '../helpers';

const SAVED = 'https://example.com/badge-saved';
const OTHER = 'https://example.com/badge-other';

test('badge appears when a tab is bookmarked and clears on navigating away', async ({
	context,
	serviceWorker,
}) => {
	const page = await openTab(context, SAVED);

	const tabId = await findTabIdByUrl(serviceWorker, SAVED);
	expect(tabId).not.toBeNull();

	await expect
		.poll(() => getBadgeText(serviceWorker, tabId as number))
		.toBe('');

	await seedBookmarks(serviceWorker, [
		{ folder: 'Reading', items: [{ title: 'Saved', url: SAVED }] },
	]);
	await expect
		.poll(() => getBadgeText(serviceWorker, tabId as number))
		.toBe('✓');

	await page.goto(OTHER);
	await expect
		.poll(() => getBadgeText(serviceWorker, tabId as number))
		.toBe('');
});

test('badge appears on a tab whose bookmark kept its tracking parameters', async ({
	context,
	serviceWorker,
}) => {
	const tracked = 'https://example.com/badge-tracked/?utm_source=x';
	await seedBookmarks(serviceWorker, [
		{ folder: 'Reading', items: [{ title: 'Tracked', url: tracked }] },
	]);

	await openTab(context, tracked);

	const tabId = await findTabIdByUrl(serviceWorker, tracked);
	expect(tabId).not.toBeNull();
	await expect
		.poll(() => getBadgeText(serviceWorker, tabId as number))
		.toBe('✓');
});
