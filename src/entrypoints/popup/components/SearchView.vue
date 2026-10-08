<template>
  <div class="search-view">
    <FolderSelector
      ref="folderSelectorRef"
      v-model="folderId"
      :auto-select-default="false"
      :on-arrow-down-with-selection="focusFirstBookmark"
    />

    <div v-if="folderId" class="search-options">
      <label class="checkbox-label">
        <input
          v-model="recursive"
          type="checkbox"
          class="checkbox-input"
        >
        <span class="checkbox-text">{{ i18n.t('includeSubfolders') }}</span>
      </label>
    </div>

    <div v-if="!error" class="filter-container">
      <div class="filter-input-wrapper input-with-clear">
        <input
          ref="filterInputRef"
          v-model="filterQuery"
          type="text"
          class="form-input"
          :class="{ 'has-clear': filterQuery }"
          :placeholder="folderId ? i18n.t('filterBookmarks') : i18n.t('searchAllBookmarks')"
          @keydown.down.prevent="focusFirstBookmark"
        >
        <button
          v-if="filterQuery"
          type="button"
          class="clear-button"
          @mousedown.prevent="filterQuery = ''"
          :title="i18n.t('clearSelection')"
        >
          <IconX />
        </button>
      </div>
      <label class="fuzzy-toggle" :title="i18n.t('fuzzySearchTooltip')" @mousedown.prevent>
        <input
          v-model="fuzzy"
          type="checkbox"
          class="fuzzy-checkbox"
        >
        <span class="fuzzy-label">{{ i18n.t('fuzzySearch') }}</span>
      </label>
    </div>

    <div v-if="error" class="error-message">
      {{ errorMessage }}
    </div>

    <BookmarkList
      ref="bookmarkListRef"
      v-if="!error"
      :results="results"
      :is-loading="isLoading"
      :empty-message="folderId ? i18n.t('emptyFolderMessage') : i18n.t('typeToSearch')"
      :filter-query="filterQuery"
      :is-fuzzy="fuzzy"
      @open-bookmark="handleOpenBookmark"
      @bookmark-deleted="remove"
      @escape-top="focusFilterInput"
    />

    <div v-if="hiddenCount" class="more-results">
      {{ i18n.t('moreResults', { count: hiddenCount }) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue';
import { computed, onMounted, ref } from 'vue';
import { i18n } from '#i18n';
import { useBookmarkBrowser } from '@/composables/useBookmarkBrowser';
import type { BookmarkItem } from '@/composables/useBookmarkFolder';
import { useFolderTree } from '@/composables/useFolderTree';
import IconX from '~icons/lucide/x';
import BookmarkList from './BookmarkList.vue';
import FolderSelector from './FolderSelector.vue';

const bookmarkListRef = ref<ComponentPublicInstance | null>(null);
const folderSelectorRef = ref<{ focus: () => void } | null>(null);
const filterInputRef = ref<HTMLInputElement | null>(null);

const { folderMap, loadFolders } = useFolderTree();
const {
	folderId,
	filterQuery,
	recursive,
	fuzzy,
	results,
	hiddenCount,
	isLoading,
	error,
	init,
	remove,
} = useBookmarkBrowser(folderMap);

const errorMessage = computed(() => (error.value ? i18n.t(error.value) : ''));

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

const focusFilterInput = () => {
	filterInputRef.value?.focus();
};

const focus = () => {
	folderSelectorRef.value?.focus();
};

defineExpose({ focus });

onMounted(async () => {
	await loadFolders();
	await init();
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
}

.search-options {
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-input-wrapper {
  flex: 1;
}

.fuzzy-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.fuzzy-toggle:hover {
  color: var(--text-primary);
}

.fuzzy-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--accent-primary);
}

.fuzzy-label {
  user-select: none;
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
}

.checkbox-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.checkbox-label:hover .checkbox-text {
  color: var(--text-primary);
}

.more-results {
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
}
</style>
