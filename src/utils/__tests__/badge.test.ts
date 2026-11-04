import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { actionApi } from '@/utils/action';
import { updateBadgeForTab } from '@/utils/badge';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

interface BookmarksApi {
	search(query: { url: string }): Promise<BookmarkTreeNode[]>;
}

const bookmarks = browser.bookmarks as unknown as BookmarksApi;

beforeEach(() => {
	fakeBrowser.reset();
	vi.spyOn(bookmarks, 'search').mockResolvedValue([
		{ id: 'B1', url: 'https://example.com/?id=1' } as BookmarkTreeNode,
	]);
	vi.spyOn(actionApi, 'setBadgeBackgroundColor').mockResolvedValue();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('updateBadgeForTab', () => {
	it('marks a tracked tab url as bookmarked when the clean url is saved', async () => {
		const setBadgeText = vi
			.spyOn(actionApi, 'setBadgeText')
			.mockResolvedValue();

		await updateBadgeForTab(7, 'https://example.com/?id=1&utm_source=x');

		expect(setBadgeText).toHaveBeenCalledWith({ text: '✓', tabId: 7 });
	});

	it('compares the raw tab url when the setting is off', async () => {
		await storage.setItem('local:searchmark_stripTrackingParams', false);
		const setBadgeText = vi
			.spyOn(actionApi, 'setBadgeText')
			.mockResolvedValue();

		await updateBadgeForTab(7, 'https://example.com/?id=1&utm_source=x');

		expect(setBadgeText).toHaveBeenCalledWith({ text: '', tabId: 7 });
	});
});
