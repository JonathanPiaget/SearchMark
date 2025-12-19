<template>
  <div class="folder-selector">
    <div class="form-group">
      <label for="folder-search">{{ i18n.t('folder') }}</label>
      <div class="search-container">
        <input
          ref="folderInput"
          id="folder-search"
          v-model="searchQuery"
          type="text"
          class="form-input"
          :placeholder="isInitializing ? i18n.t('loadingFolders') : i18n.t('searchFolders')"
          :disabled="isInitializing"
          @input="onSearchInput"
          @keydown="handleKeydown"
          @focus="onFocus"
          @blur="onBlur"
        >
        <div
          v-if="showDropdown && searchQuery.trim()"
          class="dropdown-container"
        >
          <div class="shortcut-hint">
            {{ i18n.t('expandHint') }}
          </div>
      <div v-if="searchResults.length > 0">
        <div
          v-for="(item, index) in searchResults"
          :key="item.id"
          :class="['dropdown-item', { highlighted: index === highlightedIndex }]"
          @mousedown="selectFolder(item)"
          @mouseenter="highlightedIndex = index"
          @keydown="handleItemKeydown($event, item)"
          tabindex="-1"
        >
          <div class="folder-info">
            <div class="folder-main">
              <div class="folder-name-section">
                <span class="folder-icon">📁</span>
                <span class="folder-name">
                  <template v-for="(part, partIndex) in highlightText(item.title, searchQuery)" :key="`${item.id}-${partIndex}`">
                    <span v-if="part.highlighted" class="highlight">{{ part.text }}</span>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </span>
              </div>
              <div v-if="item.children && item.children.length > 0" class="folder-actions">
                <span class="children-count">
                  ({{ item.children.length }} {{ item.children.length === 1 ? i18n.t('child') : i18n.t('children') }})
                </span>
                <span class="expand-hint">
                  →
                </span>
              </div>
            </div>
            <div v-if="item.path" class="folder-breadcrumb">
              {{ item.path }}
            </div>
            <div v-if="showChildrenFor === item.id && item.children && item.children.length > 0" class="children-list">
              <div class="children-header">{{ i18n.t('contains') }}:</div>
              <div class="children-items">
                <span
                  v-for="child in item.children"
                  :key="child.id"
                  class="child-folder"
                  @click.stop="selectChildFolder(child)"
                  @mousedown.stop
                >
                  📁 {{ child.title }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">{{ i18n.t('noFoldersFound') }}</div>
        <div class="no-results-hint">{{ i18n.t('tryDifferentSearch') }}</div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { i18n } from '#i18n';
import { useFolderSearch } from '../../../composables/useFolderSearch';
import type { BookmarkFolder } from '../../../composables/useFolderTree';
import { useFolderTree } from '../../../composables/useFolderTree';
import { useKeyboardNavigation } from '../../../composables/useKeyboardNavigation';
import { getBookmarkToolbarId } from '../../../utils/bookmark';

interface Props {
	modelValue: string;
	autofocus?: boolean;
	autoSelectDefault?: boolean;
	onArrowDownWithSelection?: () => boolean;
}

interface Emits {
	(e: 'update:modelValue', value: string): void;
	(e: 'folderSelected', folder: { id: string; name: string }): void;
	(e: 'enterPressed'): void;
}

const props = withDefaults(defineProps<Props>(), {
	autofocus: true,
	autoSelectDefault: true,
});
const emit = defineEmits<Emits>();

const showDropdown = ref(false);
const folderInput = ref<HTMLInputElement>();
const selectedFolder = ref<BookmarkFolder | null>(null);
const isInitializing = ref(true);

const { allFolders, loadFolders } = useFolderTree();
const { searchQuery, searchResults, searchFolders, highlightText } =
	useFolderSearch(allFolders);
const { highlightedIndex, showChildrenFor, handleNavigation, resetNavigation } =
	useKeyboardNavigation();

const initializeFolders = async () => {
	await loadFolders();

	if (props.autoSelectDefault && !props.modelValue) {
		const toolbarId = await getBookmarkToolbarId();
		const bookmarkToolbar = allFolders.value.find((f) => f.id === toolbarId);
		if (bookmarkToolbar) {
			selectedFolder.value = bookmarkToolbar;
			emit('update:modelValue', bookmarkToolbar.id);
			emit('folderSelected', {
				id: bookmarkToolbar.id,
				name: bookmarkToolbar.title,
			});
		}
	}
};

const onSearchInput = () => {
	searchFolders();
	highlightedIndex.value = searchResults.value.length > 0 ? 0 : -1;
	showDropdown.value = searchQuery.value.trim().length > 0;
};

const onFocus = () => {
	// Clear the input when focused for search
	searchQuery.value = '';
	showDropdown.value = false;
};

const selectFolder = (folder: BookmarkFolder) => {
	selectedFolder.value = folder;
	searchQuery.value = folder.title;
	showDropdown.value = false;
	resetNavigation();
	emit('update:modelValue', folder.id);
	emit('folderSelected', { id: folder.id, name: folder.title });
};

const selectChildFolder = (child: BookmarkFolder) => {
	// Find the full folder object from allFolders to ensure it has all properties
	const fullFolder = allFolders.value.find((f) => f.id === child.id) || child;
	selectFolder(fullFolder);
};

const onBlur = () => {
	setTimeout(() => {
		showDropdown.value = false;
		resetNavigation();
		if (!showDropdown.value && selectedFolder.value) {
			searchQuery.value = selectedFolder.value.title;
		} else if (!showDropdown.value) {
			searchQuery.value = '';
		}
	}, 150);
};

const handleKeydown = (event: KeyboardEvent) => {
	if (
		event.key === 'ArrowDown' &&
		!showDropdown.value &&
		selectedFolder.value &&
		props.onArrowDownWithSelection
	) {
		const handled = props.onArrowDownWithSelection();
		if (handled) {
			event.preventDefault();
			return;
		}
	}

	if (!showDropdown.value && searchQuery.value.trim()) {
		if (
			event.key === 'ArrowDown' ||
			(event.key === 'Enter' && !selectedFolder.value)
		) {
			showDropdown.value = true;
			searchFolders();
			highlightedIndex.value = searchResults.value.length > 0 ? 0 : -1;
			return;
		}
	}

	if (showDropdown.value && searchResults.value.length > 0) {
		handleNavigation(event, searchResults.value, {
			onEnter: (item) => selectFolder(item),
			onEscape: () => {
				showDropdown.value = false;
				searchQuery.value = '';
				resetNavigation();
				folderInput.value?.blur();
			},
			onEmitEnter: () => emit('enterPressed'),
		});
		return;
	}

	if (event.key === 'Enter') {
		if (selectedFolder.value) {
			emit('enterPressed');
		}
	} else if (event.key === 'Escape') {
		showDropdown.value = false;
		searchQuery.value = '';
		resetNavigation();
		folderInput.value?.blur();
	}
};

const handleItemKeydown = (event: KeyboardEvent, item: BookmarkFolder) => {
	if (event.key === ' ' && event.shiftKey) {
		event.preventDefault();
		if (item.children && item.children.length > 0) {
			showChildrenFor.value =
				showChildrenFor.value === item.id ? null : item.id;
		}
	}
};

// Watch for external changes to modelValue
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue && selectedFolder.value?.id !== newValue) {
			const folder = allFolders.value.find((f) => f.id === newValue);
			if (folder) {
				selectedFolder.value = folder;
				searchQuery.value = folder.title; // Show folder name in input
			}
		} else if (!newValue) {
			// Clear selection when modelValue is empty (reset to default)
			selectedFolder.value = null;
			searchQuery.value = '';
		}
	},
);

onMounted(async () => {
	try {
		await initializeFolders();
	} finally {
		isInitializing.value = false;
		if (props.autofocus) {
			await nextTick(); // Waits for Vue to update the DOM
			folderInput.value?.focus();
		}
	}
});
</script>

<style scoped>
.search-container {
  position: relative;
}

.shortcut-hint {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 8px 12px;
  font-style: italic;
  text-align: center;
  opacity: 0.8;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
  margin: 0;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.dropdown-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--dropdown-bg);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--shadow-secondary);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.dropdown-item {
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.1s, color 0.1s, border-color 0.2s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.highlighted {
  background-color: var(--accent-primary);
  color: white;
}

.dropdown-item:hover .folder-name,
.dropdown-item.highlighted .folder-name {
  color: white;
  font-weight: 600;
}

.dropdown-item:hover .folder-breadcrumb,
.dropdown-item.highlighted .folder-breadcrumb {
  color: rgba(255, 255, 255, 0.8);
}

.dropdown-item:hover .children-header,
.dropdown-item.highlighted .children-header {
  color: rgba(255, 255, 255, 0.9);
}

.dropdown-item:hover .child-folder,
.dropdown-item.highlighted .child-folder {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.children-count {
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 4px;
  font-weight: normal;
  transition: color 0.2s ease;
}

.expand-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 6px;
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.dropdown-item:hover .children-count,
.dropdown-item.highlighted .children-count {
  color: rgba(255, 255, 255, 0.8);
}

.dropdown-item:hover .expand-hint,
.dropdown-item.highlighted .expand-hint {
  background-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.folder-info {
  padding: 8px 12px;
}

.folder-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.folder-name-section {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.folder-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  min-width: 0;
}

.folder-icon {
  font-size: 12px;
}

.folder-name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  transition: color 0.2s ease;
}

.child-indicator {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: auto;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.folder-breadcrumb {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.8;
  margin-left: 18px;
  transition: color 0.2s ease;
}

.children-list {
  margin-top: 8px;
  margin-left: 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 6px;
  max-width: 100%;
  overflow: hidden;
}

.children-header {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.children-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.child-folder {
  font-size: 11px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.1s, color 0.1s, border-color 0.2s ease;
  border: 1px solid var(--border-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.child-folder:hover {
  background-color: var(--accent-primary);
  color: white;
  border-color: var(--accent-hover);
}

.dropdown-item:hover .child-folder,
.dropdown-item.highlighted .child-folder {
  background-color: rgba(255, 255, 255, 0.9);
  color: #2d1b4e;
  border-color: rgba(255, 255, 255, 0.7);
}

.dropdown-item:hover .child-folder:hover,
.dropdown-item.highlighted .child-folder:hover {
  background-color: rgba(255, 255, 255, 1);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.more-children {
  font-size: 11px;
  color: var(--text-secondary);
  font-style: italic;
  transition: color 0.2s ease;
}

/* Highlighting styles */
.highlight {
  background-color: var(--highlight-bg);
  color: var(--highlight-text);
  font-weight: 600;
  padding: 1px 2px;
  border-radius: 2px;
}

.dropdown-item.highlighted .highlight,
.dropdown-item:hover .highlight {
  background-color: var(--highlight-selected);
  color: #000;
  font-weight: 700;
}

/* No results styles */
.no-results {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.no-results-icon {
  font-size: 24px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.no-results-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--text-primary);
  transition: color 0.2s ease;
}

.no-results-hint {
  font-size: 12px;
  color: var(--text-muted);
  transition: color 0.2s ease;
}
</style>
