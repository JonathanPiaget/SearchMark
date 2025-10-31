import { ref } from 'vue';
import { i18n } from '#i18n';

export function useBookmarkActions() {
	const isDeleting = ref(false);
	const deleteError = ref<string | null>(null);

	/**
	 * Deletes a bookmark by ID and shows a notification
	 * @param id - The bookmark ID to delete
	 * @returns Promise that resolves when deletion is complete
	 */
	const deleteBookmark = async (id: string): Promise<void> => {
		isDeleting.value = true;
		deleteError.value = null;

		try {
			await browser.bookmarks.remove(id);

			try {
				const [tab] = await browser.tabs.query({
					active: true,
					currentWindow: true,
				});

				if (tab?.id && typeof tab.id === 'number') {
					await browser.tabs.sendMessage(tab.id, {
						type: 'SHOW_NOTIFICATION',
						message: i18n.t('bookmarkDeleted'),
						isError: false,
					});
				}
			} catch {
				// Silently ignore notification errors
				console.log(
					'Could not show notification (content script not available on this page)',
				);
			}
		} catch (error) {
			console.error(`Failed to delete bookmark with ID ${id}:`, error);
			deleteError.value = i18n.t('bookmarkError');
			throw error;
		} finally {
			isDeleting.value = false;
		}
	};

	return {
		isDeleting,
		deleteError,
		deleteBookmark,
	};
}
