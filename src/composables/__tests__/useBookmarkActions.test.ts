import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
	countDescendants,
	useBookmarkActions,
} from '@/composables/useBookmarkActions';
import { stubLocales } from '@/test-utils/locales';

import * as logger from '@/utils/logger';
import * as notifyModule from '@/utils/notify';

beforeEach(async () => {
	fakeBrowser.reset();
	await stubLocales();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('deleteBookmark', () => {
	it('removes the bookmark, notifies, and resets isDeleting', async () => {
		const remove = vi
			.spyOn(browser.bookmarks, 'remove')
			.mockResolvedValue(undefined);
		const notify = vi.spyOn(notifyModule, 'notify').mockResolvedValue();

		const { deleteBookmark, isDeleting, deleteError } = useBookmarkActions();
		await deleteBookmark('B1');

		expect(remove).toHaveBeenCalledWith('B1');
		expect(notify).toHaveBeenCalledOnce();
		expect(isDeleting.value).toBe(false);
		expect(deleteError.value).toBeNull();
	});

	it('sets deleteError, rethrows, logs, and resets isDeleting on failure', async () => {
		const failure = new Error('remove failed');
		vi.spyOn(browser.bookmarks, 'remove').mockRejectedValue(failure);
		const notify = vi.spyOn(notifyModule, 'notify').mockResolvedValue();
		const logSpy = vi.spyOn(logger, 'logError').mockImplementation(() => {});

		const { deleteBookmark, isDeleting, deleteError } = useBookmarkActions();

		await expect(deleteBookmark('B1')).rejects.toThrow(failure);

		expect(deleteError.value).toBe('Error saving bookmark');
		expect(isDeleting.value).toBe(false);
		expect(notify).not.toHaveBeenCalled();
		expect(logSpy).toHaveBeenCalledWith(expect.any(String), failure);
	});
});

describe('deleteFolder', () => {
	it('removes the folder with its contents and notifies', async () => {
		const removeTree = vi
			.spyOn(browser.bookmarks, 'removeTree')
			.mockResolvedValue(undefined);
		const notify = vi.spyOn(notifyModule, 'notify').mockResolvedValue();

		const { deleteFolder, isDeleting } = useBookmarkActions();
		await deleteFolder('F1');

		expect(removeTree).toHaveBeenCalledWith('F1');
		expect(notify).toHaveBeenCalledWith('Folder deleted successfully');
		expect(isDeleting.value).toBe(false);
	});

	it('rethrows without notifying when the browser refuses', async () => {
		const failure = new Error('cannot remove a root folder');
		vi.spyOn(browser.bookmarks, 'removeTree').mockRejectedValue(failure);
		const notify = vi.spyOn(notifyModule, 'notify').mockResolvedValue();
		vi.spyOn(logger, 'logError').mockImplementation(() => {});

		const { deleteFolder, isDeleting } = useBookmarkActions();

		await expect(deleteFolder('F1')).rejects.toThrow(failure);
		expect(notify).not.toHaveBeenCalled();
		expect(isDeleting.value).toBe(false);
	});
});

describe('countDescendants', () => {
	const bookmark = { url: 'https://example.com' };

	it('counts bookmarks and subfolders at any depth, not the folder itself', () => {
		const folder = {
			children: [bookmark, { children: [bookmark, { children: [] }] }],
		};

		expect(countDescendants(folder)).toEqual({ bookmarks: 2, folders: 2 });
	});

	it('returns zeros for an empty folder', () => {
		expect(countDescendants({ children: [] })).toEqual({
			bookmarks: 0,
			folders: 0,
		});
	});
});
