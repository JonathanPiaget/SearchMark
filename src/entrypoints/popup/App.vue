<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useBookmarkSearch } from '@/composables/useBookmarkSearch';
import { useFolderTree } from '@/composables/useFolderTree';
import { useSaveBookmark } from '@/composables/useSaveBookmark';
import { useTheme } from '@/composables/useTheme';
import { i18n } from '@/utils/i18n';
import { logError } from '@/utils/logger';
import { getCurrentTab, isBlankPage } from '@/utils/tabs';
import IconBookmarkPlus from '~icons/lucide/bookmark-plus';
import IconSearch from '~icons/lucide/search';
import BookmarkForm from './components/BookmarkForm.vue';
import ExistingBookmarks from './components/ExistingBookmarks.vue';
import FolderSelector from './components/FolderSelector.vue';
import SaveButton from './components/SaveButton.vue';
import SearchView from './components/SearchView.vue';
import SeeLaterButton from './components/SeeLaterButton.vue';
import SettingsButton from './components/SettingsButton.vue';
import ShortcutsHelp from './components/ShortcutsHelp.vue';
import ThemeToggle from './components/ThemeToggle.vue';

const activeView = ref<'save' | 'search'>('save');
const currentUrl = ref('');
const currentTitle = ref('');
const message = ref('');
const isLoading = ref(false);
const bookmarkUrl = ref('');
const bookmarkTitle = ref('');
const rawUrl = ref('');
const removedParams = ref<string[]>([]);
const trackingRemoved = computed(() => bookmarkUrl.value === currentUrl.value);
const toggleTracking = () => {
	bookmarkUrl.value = trackingRemoved.value ? rawUrl.value : currentUrl.value;
};
const { selectedFolderId, selectedFolderName, pendingFolder, save } =
	useSaveBookmark();

const hasOpenedSearch = ref(false);
const isBlank = computed(() => isBlankPage(bookmarkUrl.value));
const folderSelectorRef = ref<{ focus: () => void } | null>(null);
const searchViewRef = ref<{ focus: () => void } | null>(null);

const switchView = (view: 'save' | 'search') => {
	activeView.value = view;
	if (view === 'search') {
		hasOpenedSearch.value = true;
		nextTick(() => searchViewRef.value?.focus());
	} else {
		nextTick(() => folderSelectorRef.value?.focus());
	}
};

const handleViewShortcut = (event: KeyboardEvent) => {
	if (!event.altKey || event.ctrlKey || event.metaKey) return;
	if (event.key === 'ArrowLeft') {
		event.preventDefault();
		switchView('save');
	} else if (event.key === 'ArrowRight') {
		event.preventDefault();
		switchView('search');
	}
};

const { initTheme } = useTheme();
const { folderMap, loadFolders } = useFolderTree();
const {
	bookmarkLocations,
	isLoading: isSearching,
	searchByUrl,
} = useBookmarkSearch(folderMap);

const loadCurrentTab = async () => {
	try {
		const tab = await getCurrentTab();
		currentUrl.value = tab.url;
		currentTitle.value = tab.title;
		bookmarkUrl.value = tab.url;
		bookmarkTitle.value = tab.title;
		rawUrl.value = tab.rawUrl;
		removedParams.value = tab.removedParams;

		await loadFolders();
		await searchByUrl(tab.url);
	} catch (error) {
		logError('Failed to load current tab', error);
		message.value = i18n.t('bookmarkError');
		setTimeout(() => {
			message.value = '';
		}, 2000);
	}
};

onMounted(() => {
	initTheme();
	loadCurrentTab();
	window.addEventListener('keydown', handleViewShortcut, true);
});

onUnmounted(() => {
	window.removeEventListener('keydown', handleViewShortcut, true);
});

const handleBookmarkDeleted = async () => {
	// Refresh the bookmark search after deletion
	if (currentUrl.value) {
		await searchByUrl(currentUrl.value);
	}
};

const saveBookmark = async () => {
	if (isBlank.value) {
		return;
	}
	isLoading.value = true;
	try {
		await save({ title: bookmarkTitle.value, url: bookmarkUrl.value });
		window.close();
	} catch (error) {
		logError('Failed to save bookmark', error);
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
        <ShortcutsHelp />
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
        <span class="tab-icon"><IconBookmarkPlus /></span>
        <span class="tab-label">{{ i18n.t('save') }}</span>
      </button>
      <button
        :class="['tab-button', { active: activeView === 'search' }]"
        @click="switchView('search')"
      >
        <span class="tab-icon"><IconSearch /></span>
        <span class="tab-label">{{ i18n.t('search') }}</span>
      </button>
    </div>

    <!-- Save View -->
    <div v-show="activeView === 'save'" class="save-view">
      <ExistingBookmarks
        :locations="bookmarkLocations"
        :is-loading="isSearching"
        @bookmark-deleted="handleBookmarkDeleted"
      />

      <FolderSelector
        ref="folderSelectorRef"
        v-model="selectedFolderId"
        :show-toolbar-option="true"
        :allow-create="true"
        @change="(folder) => selectedFolderName = folder?.title ?? ''"
        @pending="(pending) => pendingFolder = pending"
        @submit="saveBookmark"
      />

      <BookmarkForm
        v-model:model-title="bookmarkTitle"
        :tracking-params="removedParams"
        :tracking-removed="trackingRemoved"
        @submit="saveBookmark"
        @toggle-tracking="toggleTracking"
      />

      <SaveButton
        :message="isBlank ? i18n.t('nothingToSave') : message"
        :error="!isBlank && !!message"
        :is-loading="isLoading"
        :disabled="isBlank"
        @save="saveBookmark"
      />

      <SeeLaterButton v-if="!isBlank" />
    </div>

    <!-- Search View -->
    <SearchView ref="searchViewRef" v-if="hasOpenedSearch" v-show="activeView === 'search'" />
  </div>
</template>

<style scoped>
.container {
  position: relative;
  width: 450px;
  max-height: 600px;
  padding: 16px;
  background: var(--bg-secondary);
  transition: background 0.2s ease;
  overflow: visible;
  display: flex;
  flex-direction: column;
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

.save-view .see-later {
  margin-top: 12px;
}
</style>
