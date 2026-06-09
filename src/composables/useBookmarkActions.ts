import { ref } from 'vue';
import { i18n } from '#i18n';
import { notify } from '../utils/notify';

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

			notify(i18n.t('bookmarkDeleted'));
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
