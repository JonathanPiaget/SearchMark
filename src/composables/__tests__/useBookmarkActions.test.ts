import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useBookmarkActions } from '@/composables/useBookmarkActions';
import { stubLocales } from '@/test-utils/locales';
import { loadLocale } from '@/utils/i18n';
import * as logger from '@/utils/logger';
import * as notifyModule from '@/utils/notify';

beforeEach(async () => {
	fakeBrowser.reset();
	stubLocales();
	await loadLocale();
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
