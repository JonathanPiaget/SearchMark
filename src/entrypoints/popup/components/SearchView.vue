<template>
  <div class="search-view">
    <div v-if="!error" class="search-container">
      <div class="form-input search-box" @click="focus">
        <span v-if="scope" class="scope-chip" :title="scope.path">
          <IconFolder class="scope-icon" />
          <span class="scope-title">{{ scope.title }}</span>
          <button
            type="button"
            class="scope-clear"
            :title="i18n.t('clearScope')"
            @mousedown.prevent="clearScope"
          >
            <IconX />
          </button>
        </span>
        <input
          ref="searchInputRef"
          v-model="query"
          type="text"
          class="search-input"
          :placeholder="scope ? i18n.t('searchInScope') : i18n.t('searchAll')"
          @keydown.down.prevent="focusFirstBookmark"
          @keydown.backspace="onBackspace"
        >
        <button
          v-if="query"
          type="button"
          class="clear-button"
          @mousedown.prevent="query = ''"
          :title="i18n.t('clearSelection')"
        >
          <IconX />
        </button>
        <button
          type="button"
          class="fuzzy-button"
          :class="{ active: fuzzy }"
          :aria-pressed="fuzzy"
          :title="i18n.t('fuzzySearchTooltip')"
          @mousedown.prevent="fuzzy = !fuzzy"
        >
          <IconApproximately />
        </button>
      </div>
    </div>

    <div v-if="scopeId" class="search-options">
      <label class="checkbox-label">
        <input
          v-model="recursive"
          type="checkbox"
          class="checkbox-input"
        >
        <span class="checkbox-text">{{ i18n.t('includeSubfolders') }}</span>
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
      :empty-message="scopeId ? i18n.t('emptyFolderMessage') : i18n.t('typeToSearch')"
      @select="handleSelect"
      @bookmark-deleted="remove"
      @escape-top="focus"
    />

    <div v-if="hiddenCount" class="more-results">
      {{ i18n.t('moreResults', hiddenCount) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue';
import { computed, onMounted, ref } from 'vue';
import {
	isFolder,
	type SearchItem,
	useBookmarkBrowser,
} from '@/composables/useBookmarkBrowser';
import { useFolderTree } from '@/composables/useFolderTree';
import { i18n } from '@/utils/i18n';
import IconApproximately from '~icons/lucide/equal-approximately';
import IconFolder from '~icons/lucide/folder';
import IconX from '~icons/lucide/x';
import BookmarkList from './BookmarkList.vue';

const bookmarkListRef = ref<ComponentPublicInstance | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const { folderMap, allFolders, loadFolders } = useFolderTree();
const {
	scopeId,
	query,
	recursive,
	fuzzy,
	results,
	hiddenCount,
	isLoading,
	error,
	init,
	remove,
} = useBookmarkBrowser(folderMap, allFolders);

const scope = computed(() => folderMap.value.get(scopeId.value));
const errorMessage = computed(() => (error.value ? i18n.t(error.value) : ''));

const focus = () => {
	searchInputRef.value?.focus();
};

const focusFirstBookmark = () => {
	const firstBookmark =
		bookmarkListRef.value?.$el?.querySelector('.bookmark-item');
	firstBookmark?.focus();
};

const clearScope = () => {
	scopeId.value = '';
	focus();
};

const onBackspace = (event: KeyboardEvent) => {
	if (!event.repeat && !query.value && scopeId.value) clearScope();
};

const handleSelect = (item: SearchItem) => {
	if (isFolder(item)) {
		scopeId.value = item.id;
		query.value = '';
		focus();
		return;
	}
	browser.tabs.create({ url: item.url, active: false });
};

defineExpose({ focus });

onMounted(async () => {
	await loadFolders();
	await init();
});
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

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  cursor: text;
}

.search-box .clear-button {
  position: static;
  transform: none;
  flex-shrink: 0;
}

.search-box:focus-within {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--shadow-primary);
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 4px 4px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  outline: none;
}

.scope-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 50%;
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.scope-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.scope-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope-clear {
  display: flex;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.scope-clear svg {
  width: 10px;
  height: 10px;
}

.scope-clear:hover {
  color: var(--text-primary);
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
