<template>
  <div class="search-view">
    <FolderSelector
      v-model="selectedFolderId"
      :autofocus="false"
      :auto-select-default="false"
      :on-arrow-down-with-selection="focusFirstBookmark"
      :show-all-option="true"
    />

    <div v-if="selectedFolderId" class="search-options">
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

    <div v-if="!error" class="filter-container">
      <div class="filter-input-wrapper">
        <input
          v-model="filterQuery"
          type="text"
          class="form-input"
          :placeholder="selectedFolderId ? i18n.t('filterBookmarks') : i18n.t('searchAllBookmarks')"
        >
      </div>
      <label class="fuzzy-toggle" @mousedown.prevent>
        <input
          v-model="isFuzzyFilter"
          type="checkbox"
          class="fuzzy-checkbox"
          @change="saveFuzzyPreference"
        >
        <span class="fuzzy-label">{{ i18n.t('fuzzySearch') }}</span>
      </label>
    </div>

    <div v-if="error" class="error-message">
      {{ i18n.t('error') }}
    </div>

    <BookmarkList
      ref="bookmarkListRef"
      v-if="!error"
      :bookmarks="displayedBookmarks"
      :is-loading="isLoading"
      :empty-message="selectedFolderId ? i18n.t('emptyFolderMessage') : i18n.t('typeToSearch')"
      :filter-query="filterQuery"
      :filter-indexes-map="filterIndexesMap"
      :is-fuzzy="isFuzzyFilter"
      @open-bookmark="handleOpenBookmark"
    />

    <div v-if="hasMoreResults" class="more-results">
      {{ i18n.t('moreResults').replace('{count}', String(filteredBookmarks.length - MAX_RESULTS)) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import fuzzysort from 'fuzzysort';
import type { ComponentPublicInstance } from 'vue';
import { computed, onMounted, ref, watch } from 'vue';
import { i18n } from '#i18n';
import type { BookmarkItem } from '../../../composables/useBookmarkFolder';
import { useBookmarkFolder } from '../../../composables/useBookmarkFolder';
import { useFolderTree } from '../../../composables/useFolderTree';
import BookmarkList from './BookmarkList.vue';
import FolderSelector from './FolderSelector.vue';

const FUZZY_THRESHOLD = 0.3;
const RECURSIVE_STORAGE_KEY = 'searchmark_recursive_search';
const FUZZY_FILTER_STORAGE_KEY = 'searchmark_fuzzy_filter';
const MAX_RESULTS = 100;

const selectedFolderId = ref('');
const isRecursive = ref(true);
const bookmarkListRef = ref<ComponentPublicInstance | null>(null);
const filterQuery = ref('');
const isFuzzyFilter = ref(true);
const filterIndexesMap = ref<Map<string, readonly number[]>>(new Map());

const { folderMap, loadFolders } = useFolderTree();
const { bookmarks, isLoading, error, loadBookmarks, loadAllBookmarks } =
	useBookmarkFolder(folderMap);

const filteredBookmarks = computed(() => {
	if (!filterQuery.value.trim()) {
		filterIndexesMap.value = new Map();
		return bookmarks.value;
	}

	if (isFuzzyFilter.value) {
		const results = fuzzysort.go(filterQuery.value, bookmarks.value, {
			key: 'title',
			threshold: FUZZY_THRESHOLD,
		});
		const indexMap = new Map<string, readonly number[]>();
		const filtered = results.map((r) => {
			indexMap.set(r.obj.id, r.indexes);
			return r.obj;
		});
		filterIndexesMap.value = indexMap;
		return filtered;
	}

	const query = filterQuery.value.toLowerCase();
	filterIndexesMap.value = new Map();
	return bookmarks.value.filter((b) => b.title.toLowerCase().includes(query));
});

const displayedBookmarks = computed(() => {
	if (!selectedFolderId.value && !filterQuery.value.trim()) {
		return [];
	}
	return filteredBookmarks.value.slice(0, MAX_RESULTS);
});

const hasMoreResults = computed(
	() =>
		filterQuery.value.trim() && filteredBookmarks.value.length > MAX_RESULTS,
);

const saveFuzzyPreference = () => {
	browser.storage.local.set({
		[FUZZY_FILTER_STORAGE_KEY]: isFuzzyFilter.value,
	});
};

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
	const result = await browser.storage.local.get([
		RECURSIVE_STORAGE_KEY,
		FUZZY_FILTER_STORAGE_KEY,
	]);
	if (result[RECURSIVE_STORAGE_KEY] !== undefined) {
		isRecursive.value = result[RECURSIVE_STORAGE_KEY];
	}
	if (result[FUZZY_FILTER_STORAGE_KEY] !== undefined) {
		isFuzzyFilter.value = result[FUZZY_FILTER_STORAGE_KEY];
	}
	await loadAllBookmarks();
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
	filterQuery.value = '';
	if (newFolderId) {
		await loadBookmarks(newFolderId, isRecursive.value);
	} else {
		await loadAllBookmarks();
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
