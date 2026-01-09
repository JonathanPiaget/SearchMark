<template>
  <div class="search-view">
    <FolderSelector
      v-model="selectedFolderId"
      :autofocus="false"
      :auto-select-default="false"
      :on-arrow-down-with-selection="focusFirstBookmark"
    />

    <div class="search-options">
      <label class="checkbox-label">
        <input
          v-model="isRecursive"
          type="checkbox"
          class="checkbox-input"
          @change="handleRecursiveChange"
        >
        <span class="checkbox-text">{{ i18n.t('includeSubfolders') }}</span>
      </label>
    </div>

    <div v-if="error" class="error-message">
      {{ i18n.t('error') }}
    </div>

    <BookmarkList
      ref="bookmarkListRef"
      v-if="selectedFolderId && !error"
      :bookmarks="bookmarks"
      :is-loading="isLoading"
      :empty-message="i18n.t('emptyFolderMessage')"
      @open-bookmark="handleOpenBookmark"
    />

    <div v-if="!selectedFolderId" class="prompt-message">
      <span class="icon">🔍</span>
      <span class="message">{{ i18n.t('selectFolderPrompt') }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue';
import { onMounted, ref, watch } from 'vue';
import { i18n } from '#i18n';
import type { BookmarkItem } from '../../../composables/useBookmarkFolder';
import { useBookmarkFolder } from '../../../composables/useBookmarkFolder';
import { useFolderTree } from '../../../composables/useFolderTree';
import BookmarkList from './BookmarkList.vue';
import FolderSelector from './FolderSelector.vue';

const selectedFolderId = ref('');
const isRecursive = ref(true);
const RECURSIVE_STORAGE_KEY = 'searchmark_recursive_search';
const bookmarkListRef = ref<ComponentPublicInstance | null>(null);

const { folderMap, loadFolders } = useFolderTree();
const { bookmarks, isLoading, error, loadBookmarks } =
	useBookmarkFolder(folderMap);

const focusFirstBookmark = () => {
	if (!bookmarkListRef.value) return false;

	const firstBookmark =
		bookmarkListRef.value.$el?.querySelector('.bookmark-item');
	if (firstBookmark) {
		firstBookmark.focus();
		return true;
	}
	return false;
};

onMounted(async () => {
	await loadFolders();

	const result = await browser.storage.local.get(RECURSIVE_STORAGE_KEY);
	if (result[RECURSIVE_STORAGE_KEY] !== undefined) {
		isRecursive.value = result[RECURSIVE_STORAGE_KEY];
	}
});

const handleRecursiveChange = async () => {
	await browser.storage.local.set({
		[RECURSIVE_STORAGE_KEY]: isRecursive.value,
	});
	if (selectedFolderId.value) {
		await loadBookmarks(selectedFolderId.value, isRecursive.value);
	}
};

watch(selectedFolderId, async (newFolderId) => {
	if (newFolderId) {
		await loadBookmarks(newFolderId, isRecursive.value);
	}
});

const handleOpenBookmark = (bookmark: BookmarkItem) => {
	browser.tabs.create({ url: bookmark.url, active: true });
};
</script>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  flex: 1;
  overflow: visible;
}

.error-message {
  padding: 12px;
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  transition: all 0.2s ease;
}

.prompt-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 16px;
  text-align: center;
}

.prompt-message .icon {
  font-size: 48px;
  opacity: 0.5;
}

.prompt-message .message {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.search-options {
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent-primary);
  flex-shrink: 0;
}

.checkbox-text {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.checkbox-label:hover .checkbox-text {
  color: var(--text-primary);
}
</style>
