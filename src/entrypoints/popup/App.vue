<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { i18n } from '#i18n';
import { getBookmarkToolbarId } from '../../utils/bookmark';
import BookmarkForm from './components/BookmarkForm.vue';
import FolderSelector from './components/FolderSelector.vue';
import SaveButton from './components/SaveButton.vue';

const currentUrl = ref('');
const currentTitle = ref('');
const message = ref('');
const isLoading = ref(false);
const bookmarkUrl = ref('');
const bookmarkTitle = ref('');
const selectedFolderId = ref('');
const selectedFolderName = ref('');

const loadCurrentTab = async () => {
	try {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (tab?.url) {
			currentUrl.value = tab.url;
			currentTitle.value = tab.title || '';

			bookmarkUrl.value = currentUrl.value;
			bookmarkTitle.value = currentTitle.value;
		}
	} catch {
		message.value = i18n.t('bookmarkError');
		setTimeout(() => {
			message.value = '';
		}, 2000);
	}
};

onMounted(() => {
	loadCurrentTab();
});

const saveBookmark = async () => {
	isLoading.value = true;
	try {
		const folderId = selectedFolderId.value || (await getBookmarkToolbarId());

		await browser.bookmarks.create({
			title: bookmarkTitle.value,
			url: bookmarkUrl.value,
			parentId: folderId,
		});

		// Try to show success notification in content script (don't let failure affect save status)
		try {
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});
			if (tab?.id) {
				const notificationMessage = selectedFolderName.value
					? i18n
							.t('bookmarkSavedInFolder')
							.replace('{folderName}', selectedFolderName.value)
					: i18n.t('bookmarkSaved');

				await browser.tabs.sendMessage(tab.id, {
					type: 'SHOW_NOTIFICATION',
					message: notificationMessage,
					isError: false,
				});
			}
		} catch {
			// Silently ignore notification errors - bookmark was still saved successfully
			console.log(
				'Could not show notification (content script not available on this page)',
			);
		}

		// Close the popup
		window.close();
	} catch {
		message.value = i18n.t('bookmarkError');
		setTimeout(() => {
			message.value = '';
		}, 2000);
	} finally {
		isLoading.value = false;
	}
};
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img src="/icon.svg" alt="SearchMark Logo" class="logo">
        <h1>SearchMark</h1>
      </div>
    </div>

    <FolderSelector
      v-model="selectedFolderId"
      @folder-selected="(folder) => selectedFolderName = folder.name"
      @enter-pressed="saveBookmark"
    />

    <BookmarkForm
      v-model:model-url="bookmarkUrl"
      v-model:model-title="bookmarkTitle"
      @enter-pressed="saveBookmark"
    />

    <SaveButton
      :message="message"
      :is-loading="isLoading"
      @save="saveBookmark"
    />
  </div>
</template>

<style scoped>
.container {
  width: 380px;
  padding: 16px;
  background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 100%);
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.logo {
  width: 24px;
  height: 24px;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #5e33a9;
}
</style>
