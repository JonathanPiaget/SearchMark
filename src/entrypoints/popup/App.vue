<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { i18n } from '#i18n';
import { useBookmarkSearch } from '../../composables/useBookmarkSearch';
import { useFolderTree } from '../../composables/useFolderTree';
import { useSeeLater } from '../../composables/useSeeLater';
import { useTheme } from '../../composables/useTheme';
import { getBookmarkToolbarId } from '../../utils/bookmark';
import BookmarkForm from './components/BookmarkForm.vue';
import ExistingBookmarks from './components/ExistingBookmarks.vue';
import FolderSelector from './components/FolderSelector.vue';
import SaveButton from './components/SaveButton.vue';
import SearchView from './components/SearchView.vue';
import SeeLaterButton from './components/SeeLaterButton.vue';
import SettingsButton from './components/SettingsButton.vue';
import ThemeToggle from './components/ThemeToggle.vue';

const activeView = ref<'save' | 'search'>('save');
const currentUrl = ref('');
const currentTitle = ref('');
const message = ref('');
const isLoading = ref(false);
const bookmarkUrl = ref('');
const bookmarkTitle = ref('');
const selectedFolderId = ref('');
const selectedFolderName = ref('');

const switchView = (view: 'save' | 'search') => {
	activeView.value = view;
};

const { initTheme } = useTheme();
const { initSeeLater } = useSeeLater();
const { folderMap, loadFolders } = useFolderTree();
const {
	bookmarkLocations,
	isLoading: isSearching,
	searchByUrl,
} = useBookmarkSearch(folderMap);

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

			// Search for existing bookmarks with this URL
			await loadFolders();
			await searchByUrl(tab.url);
		}
	} catch {
		message.value = i18n.t('bookmarkError');
		setTimeout(() => {
			message.value = '';
		}, 2000);
	}
};

onMounted(() => {
	initTheme();
	initSeeLater();
	loadCurrentTab();
});

const handleBookmarkDeleted = async () => {
	// Refresh the bookmark search after deletion
	if (currentUrl.value) {
		await searchByUrl(currentUrl.value);
	}
};

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
      <div class="header-buttons">
        <SeeLaterButton />
        <SettingsButton />
        <ThemeToggle />
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="view-tabs">
      <button
        :class="['tab-button', { active: activeView === 'save' }]"
        @click="switchView('save')"
      >
        <span class="tab-icon">💾</span>
        <span class="tab-label">{{ i18n.t('save') }}</span>
      </button>
      <button
        :class="['tab-button', { active: activeView === 'search' }]"
        @click="switchView('search')"
      >
        <span class="tab-icon">🔍</span>
        <span class="tab-label">{{ i18n.t('search') }}</span>
      </button>
    </div>

    <!-- Save View -->
    <div v-if="activeView === 'save'" class="save-view">
      <ExistingBookmarks
        :locations="bookmarkLocations"
        :is-loading="isSearching"
        @bookmark-deleted="handleBookmarkDeleted"
      />

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

    <!-- Search View -->
    <SearchView v-else-if="activeView === 'search'" />
  </div>
</template>

<style scoped>
.container {
  width: 450px;
  padding: 16px;
  background: var(--bg-secondary);
  transition: background 0.2s ease;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  width: 24px;
  height: 24px;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--accent-primary);
  transition: color 0.2s ease;
}

.header-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Restore margins for Save view only */
.save-view .folder-selector {
  margin-bottom: 16px;
}

.save-view .form-group {
  margin-bottom: 16px;
}
</style>
