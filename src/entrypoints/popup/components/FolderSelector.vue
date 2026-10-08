<template>
  <div class="folder-selector">
    <div class="form-group">
      <label for="folder-search">{{ i18n.t('folder') }}</label>
      <div class="search-container input-with-clear">
        <input
          ref="folderInput"
          id="folder-search"
          v-model="inputText"
          type="text"
          class="form-input"
          :class="{ 'has-clear': selected }"
          :placeholder="isInitializing ? i18n.t('loadingFolders') : i18n.t('searchFolders')"
          :disabled="isInitializing"
          @input="onInput"
          @keydown="handleKeydown"
          @focus="onFocus"
          @blur="onBlur"
        >
        <button
          v-if="selected && inputText"
          type="button"
          class="clear-button"
          @mousedown.prevent="picker.clear"
          :title="i18n.t('clearSelection')"
        >
          <IconX />
        </button>
        <div
          v-if="isOpen && inputText.trim()"
          ref="dropdownRef"
          class="dropdown-container"
          :style="dropdownMaxHeight ? { maxHeight: `${dropdownMaxHeight}px` } : undefined"
        >
          <div class="dropdown-header" @mousedown.prevent>
            <div class="shortcut-hint">
              <kbd class="key"><IconArrowBigUp class="key-icon" />{{ i18n.t('keyShift') }}</kbd>
              <kbd class="key"><IconSpace class="key-icon" />{{ i18n.t('keySpace') }}</kbd>
              <span class="shortcut-text">{{ i18n.t('expandHint') }}</span>
            </div>
            <label class="fuzzy-toggle" :title="i18n.t('fuzzySearchTooltip')">
              <input
                v-model="isFuzzy"
                type="checkbox"
                class="fuzzy-checkbox"
              >
              <span class="fuzzy-label">{{ i18n.t('fuzzySearch') }}</span>
            </label>
          </div>
          <template v-for="(row, index) in rows" :key="row.folder.id">
            <div
              v-if="row.kind === 'toolbar'"
              :ref="(el) => { if (el) dropdownItemRefs[index] = el as HTMLElement }"
              :class="['dropdown-item', 'toolbar-item', { highlighted: index === highlighted.row }]"
              @mousedown="picker.select(row)"
              @mouseenter="picker.highlight(index)"
            >
              <div class="folder-info">
                <div class="folder-row">
                  <span class="folder-icon"><IconLibrary /></span>
                  <div class="folder-text">
                    <span class="folder-name">{{ row.folder.title }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              :ref="(el) => { if (el) dropdownItemRefs[index] = el as HTMLElement }"
              :class="['dropdown-item', { highlighted: index === highlighted.row && highlighted.child < 0 }]"
              @mousedown="picker.select(row)"
              @mouseenter="picker.highlight(index)"
            >
              <div class="folder-info">
                <div class="folder-row">
                  <span class="folder-icon"><IconFolder /></span>
                  <div class="folder-text">
                    <span class="folder-name">
                      <template v-for="(part, partIndex) in highlightText(row.folder.title, inputText, row.indexes)" :key="`${row.folder.id}-${partIndex}`">
                        <span v-if="part.highlighted" class="highlight">{{ part.text }}</span>
                        <span v-else>{{ part.text }}</span>
                      </template>
                    </span>
                    <span v-if="row.folder.path" class="folder-breadcrumb">
                      {{ row.folder.path }}
                    </span>
                  </div>
                  <div v-if="row.folder.children && row.folder.children.length > 0" class="folder-actions">
                    <span
                      class="children-count"
                      :title="`${row.folder.children.length} ${row.folder.children.length === 1 ? i18n.t('child') : i18n.t('children')}`"
                    >
                      <IconFolders class="children-count-icon" />{{ row.folder.children.length }}
                    </span>
                    <span class="expand-hint">
                      →
                    </span>
                  </div>
                </div>
                <div
                  v-if="expandedId === row.folder.id && row.folder.children && row.folder.children.length > 0"
                  class="children-list"
                  @mousedown.stop
                >
                  <span
                    v-for="(child, childIndex) in row.folder.children"
                    :key="child.id"
                    :class="['child-folder', { highlighted: index === highlighted.row && childIndex === highlighted.child }]"
                    @click.stop="picker.selectFolder(child)"
                    @mousedown.stop
                    @mouseenter="picker.highlight(index, childIndex)"
                  >
                    <span class="child-icon"><IconFolder /></span>
                    <span class="child-name">{{ child.title }}</span>
                  </span>
                </div>
              </div>
            </div>
          </template>
          <div v-if="matchCount.total === 0" class="no-results">
            <div class="no-results-icon"><IconSearchX /></div>
            <div class="no-results-text">{{ i18n.t('noFoldersFound') }}</div>
            <div class="no-results-hint">{{ i18n.t('tryDifferentSearch') }}</div>
          </div>
          <div
            v-else
            class="dropdown-footer"
            @mousedown.prevent
          >
            <div class="result-count">
              <span class="count-current">{{ matchCount.current }}</span>
              <span class="count-total"> / {{ matchCount.total }}</span>&nbsp;
              <span class="count-matches">
                {{ matchCount.total === 1 ? i18n.t('match') : i18n.t('matches') }}
              </span>
            </div>
            <div class="footer-keys">
              <kbd class="key">↑</kbd>
              <kbd class="key">↓</kbd>
              <span class="key-sep">·</span>
              <kbd class="key">↵</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, toRef } from 'vue';
import { i18n } from '#i18n';
import { useDropdownFit } from '@/composables/useDropdownFit';
import { useFolderPicker } from '@/composables/useFolderPicker';
import type { BookmarkFolder } from '@/composables/useFolderTree';
import { useFolderTree } from '@/composables/useFolderTree';
import { highlightText } from '@/utils/highlight';
import IconArrowBigUp from '~icons/lucide/arrow-big-up';
import IconFolder from '~icons/lucide/folder';
import IconFolders from '~icons/lucide/folders';
import IconLibrary from '~icons/lucide/library';
import IconSearchX from '~icons/lucide/search-x';
import IconSpace from '~icons/lucide/space';
import IconX from '~icons/lucide/x';

interface Props {
	modelValue: string;
	autofocus?: boolean;
	autoSelectDefault?: boolean;
	onArrowDownWithSelection?: () => boolean;
	showToolbarOption?: boolean;
}

interface Emits {
	(e: 'update:modelValue', value: string): void;
	(e: 'change', folder: BookmarkFolder | null): void;
	(e: 'submit'): void;
}

const props = withDefaults(defineProps<Props>(), {
	autofocus: true,
	autoSelectDefault: true,
	showToolbarOption: false,
});
const emit = defineEmits<Emits>();

const folderInput = ref<HTMLInputElement>();
const isInitializing = ref(true);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownItemRefs = ref<HTMLElement[]>([]);

const { allFolders, loadFolders } = useFolderTree();
const picker = useFolderPicker({
	folders: allFolders,
	modelValue: toRef(props, 'modelValue'),
	autoSelectDefault: props.autoSelectDefault,
	toolbarRowTitle: props.showToolbarOption
		? i18n.t('bookmarkToolbar')
		: undefined,
	onChange: (folder) => {
		emit('update:modelValue', folder?.id ?? '');
		emit('change', folder);
	},
	onSubmit: () => emit('submit'),
});
const {
	inputText,
	isOpen,
	isFuzzy,
	rows,
	matchCount,
	highlighted,
	expandedId,
	selected,
} = picker;

const { maxHeight: dropdownMaxHeight } = useDropdownFit(
	isOpen,
	folderInput,
	dropdownRef,
);

const onInput = () => {
	dropdownItemRefs.value = [];
	picker.onInput();
};

const onFocus = () => {
	picker.onFocus();
	// Firefox keeps the old scrollLeft after clearing, which renders the
	// placeholder right-aligned with a leading ellipsis. Reset it.
	nextTick(() => {
		if (folderInput.value) folderInput.value.scrollLeft = 0;
	});
};

const onBlur = (event: FocusEvent) => {
	const relatedTarget = event.relatedTarget as HTMLElement | null;
	if (relatedTarget && dropdownRef.value?.contains(relatedTarget)) {
		return;
	}
	setTimeout(picker.onBlur, 150);
};

const handleKeydown = (event: KeyboardEvent) => {
	if (
		event.key === 'ArrowDown' &&
		!isOpen.value &&
		selected.value &&
		props.onArrowDownWithSelection?.()
	) {
		event.preventDefault();
		return;
	}
	if (!picker.onKeydown(event)) return;
	if (event.key === 'Escape') folderInput.value?.blur();
	else scrollHighlightedIntoView();
};

const scrollIntoViewIfNeeded = (item: HTMLElement | undefined) => {
	const container = dropdownRef.value;
	if (!container || !item) return;
	const itemRect = item.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();
	if (
		itemRect.top < containerRect.top ||
		itemRect.bottom > containerRect.bottom
	) {
		item.scrollIntoView({ behavior: 'instant', block: 'nearest' });
	}
};

const scrollHighlightedIntoView = async () => {
	const { row, child } = highlighted.value;
	if (row < 0) return;
	if (row === 0 && child < 0) {
		dropdownRef.value?.scrollTo({ top: 0, behavior: 'instant' });
		return;
	}
	await nextTick();
	scrollIntoViewIfNeeded(
		child >= 0
			? dropdownRef.value?.querySelectorAll<HTMLElement>('.child-folder')[child]
			: dropdownItemRefs.value[row],
	);
};

const focus = () => {
	folderInput.value?.focus();
};

defineExpose({ focus });

onMounted(async () => {
	try {
		await loadFolders();
		await picker.init();
	} finally {
		isInitializing.value = false;
		if (props.autofocus) {
			await nextTick(); // Waits for Vue to update the DOM
			folderInput.value?.focus();
			// Firefox focuses the popup frame asynchronously after load and can
			// steal focus back from the input (Bugzilla 1324255); re-focus until
			// the frame has focus and the input holds it, up to 500ms.
			let attempts = 0;
			const retry = setInterval(() => {
				const input = folderInput.value;
				const done =
					!input ||
					++attempts > 10 ||
					(document.hasFocus() && document.activeElement === input);
				if (done) {
					clearInterval(retry);
					return;
				}
				input.focus();
			}, 50);
		}
	}
});
</script>

<style scoped>
.search-container {
  position: relative;
}

.dropdown-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 0;
  transition: color 0.2s ease;
}

.shortcut-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 18px;
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 5px;
  box-shadow: 0 1px 0 var(--border-primary);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.key-icon {
  width: 14px;
  height: 14px;
}

.fuzzy-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.fuzzy-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent-primary);
  border-radius: 5px;
}

.fuzzy-label {
  user-select: none;
}

.dropdown-footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-primary);
  font-size: 12px;
  color: var(--text-secondary);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.result-count {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count-current {
  color: var(--accent-primary);
  font-weight: 700;
}

.footer-keys {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.key-sep {
  color: var(--text-muted);
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
  overflow-x: hidden;
  overscroll-behavior: contain;
  scroll-padding-top: 44px;
  scroll-padding-bottom: 44px;
  z-index: 1000;
  margin-top: 4px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.dropdown-item {
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.1s, color 0.1s, border-color 0.2s ease;
}

.dropdown-item.toolbar-item {
  background-color: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-primary);
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

.children-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 4px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.children-count-icon {
  width: 13px;
  height: 13px;
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

.folder-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
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
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  flex-shrink: 0;
}

.folder-name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  transition: color 0.2s ease;
}

.folder-breadcrumb {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.children-list {
  position: relative;
  margin: 6px -12px -8px;
  padding: 4px 0;
  background: var(--dropdown-bg);
}

.children-list::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 2px;
  bottom: 2px;
  width: 1px;
  background: var(--border-primary);
}

.child-folder {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px 7px 32px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: background-color 0.1s ease, color 0.1s ease;
}

.child-folder:hover,
.child-folder.highlighted {
  background: var(--hover);
  color: var(--text-primary);
}

.child-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--text-muted);
}

.child-icon svg {
  width: 16px;
  height: 16px;
}

.child-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
