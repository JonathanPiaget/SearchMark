<template>
  <div class="folder-selector">
    <div class="form-group">
      <label for="folder-search">{{ i18n.t('folder') }}</label>
      <div class="search-container input-with-clear">
        <span v-if="scope" ref="scopeChip" class="scope-chip">
          <IconFolder class="key-icon" />
          <span class="scope-title">{{ scope.title }}</span>
          <span class="scope-sep">/</span>
        </span>
        <input
          ref="folderInput"
          id="folder-search"
          v-model="inputText"
          type="text"
          class="form-input"
          :class="{ 'has-clear': selected || pending, 'has-pending': showPendingBadge }"
          :style="scope ? { paddingLeft: `${scopeChipWidth + 14}px` } : undefined"
          :placeholder="isInitializing ? i18n.t('loadingFolders') : i18n.t('searchFolders')"
          :disabled="isInitializing"
          @input="onInput"
          @keydown="handleKeydown"
          @focus="onFocus"
          @blur="onBlur"
        >
        <span v-if="showPendingBadge" class="pending-badge">{{ i18n.t('pendingFolderBadge') }}</span>
        <button
          v-if="(selected || pending) && inputText"
          type="button"
          class="clear-button"
          @mousedown.prevent="picker.clear"
          :title="i18n.t('clearSelection')"
        >
          <IconX />
        </button>
        <div
          v-if="isOpen && (inputText.trim() || scope)"
          ref="dropdownRef"
          class="dropdown-container"
          :style="dropdownMaxHeight ? { maxHeight: `${dropdownMaxHeight}px` } : undefined"
        >
          <div class="dropdown-header" @mousedown.prevent>
            <div v-if="scope" class="shortcut-hint">
              <kbd class="key">⌫</kbd>
              <span class="shortcut-text">{{ i18n.t('leaveScopeHint', { folder: scope.title }) }}</span>
              <span class="key-sep">·</span>
              <span class="shortcut-text">{{ i18n.t('scopeSearchHint') }}</span>
            </div>
            <div v-else class="shortcut-hint">
              <kbd class="key"><IconArrowBigUp class="key-icon" />{{ i18n.t('keyShift') }}</kbd>
              <kbd class="key"><IconSpace class="key-icon" />{{ i18n.t('keySpace') }}</kbd>
              <span class="shortcut-text">{{ i18n.t('expandHint') }}</span>
              <template v-if="allowCreate">
                <span class="key-sep">·</span>
                <kbd class="key">/</kbd>
                <span class="shortcut-text">{{ i18n.t('enterFolderHint') }}</span>
              </template>
            </div>
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
                      <template v-for="(part, partIndex) in highlightByIndexes(row.folder.title, row.indexes)" :key="`${row.folder.id}-${partIndex}`">
                        <span v-if="part.highlighted" class="highlight">{{ part.text }}</span>
                        <span v-else>{{ part.text }}</span>
                      </template>
                    </span>
                    <span v-if="parentPath(row.folder)" class="folder-breadcrumb">
                      {{ parentPath(row.folder) }}
                    </span>
                  </div>
                  <div v-if="row.folder.children && row.folder.children.length > 0" class="folder-actions">
                    <span
                      class="children-count"
                      :title="i18n.t('childCount', row.folder.children.length)"
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
          <div v-if="matchCount.total === 0" class="no-results" @mousedown.prevent>
            <template v-if="canCreate">
              <div class="no-results-text">{{ i18n.t('noFolderNamed', { title: inputText.trim() }) }}</div>
              <div class="no-results-hint">{{ i18n.t('pendingFolderCreatedIn', { folder: folderLabel(picker.pendingParentId()) }) }}</div>
              <button type="button" class="create-folder-cta" @click="picker.createPending">
                <IconFolderPlus class="key-icon" />{{ i18n.t('createThisFolder') }}
                <kbd class="key">↵</kbd>
              </button>
            </template>
            <div v-else-if="scope && !inputText.trim()" class="no-results-text">{{ i18n.t('emptyFolderMessage') }}</div>
            <template v-else>
              <div class="no-results-icon"><IconSearchX /></div>
              <div class="no-results-text">{{ i18n.t('noFoldersFound') }}</div>
              <div class="no-results-hint">{{ i18n.t('tryDifferentSearch') }}</div>
            </template>
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
                {{ i18n.t('matches', matchCount.total) }}
              </span>
            </div>
            <button
              v-if="canCreate"
              type="button"
              class="create-folder-button"
              @click="picker.createPending"
            >
              <IconFolderPlus class="key-icon" />
              <span class="create-folder-label">{{ scope
                ? i18n.t('createFolderNamedIn', { title: inputText.trim(), folder: scope.title })
                : i18n.t('createFolderNamed', { title: inputText.trim() }) }}</span>
              <kbd class="key">⇧</kbd><kbd class="key">↵</kbd>
            </button>
            <div v-else class="footer-keys">
              <kbd class="key">↑</kbd>
              <kbd class="key">↓</kbd>
              <span class="key-sep">·</span>
              <kbd class="key">↵</kbd>
            </div>
          </div>
        </div>
      </div>
      <p v-if="pending" class="pending-path">
        {{ i18n.t('pendingFolderIn') }} <b>{{ folderLabel(pending.parentId) }}</b>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, toRef, watch } from 'vue';
import { useDropdownFit } from '@/composables/useDropdownFit';
import {
	type PendingFolder,
	useFolderPicker,
} from '@/composables/useFolderPicker';
import type { BookmarkFolder } from '@/composables/useFolderTree';
import { useFolderTree } from '@/composables/useFolderTree';
import { highlightByIndexes } from '@/utils/highlight';
import { i18n } from '@/utils/i18n';
import IconArrowBigUp from '~icons/lucide/arrow-big-up';
import IconFolder from '~icons/lucide/folder';
import IconFolderPlus from '~icons/lucide/folder-plus';
import IconFolders from '~icons/lucide/folders';
import IconLibrary from '~icons/lucide/library';
import IconSearchX from '~icons/lucide/search-x';
import IconSpace from '~icons/lucide/space';
import IconX from '~icons/lucide/x';

interface Props {
	modelValue: string;
	autofocus?: boolean;
	autoSelectDefault?: boolean;
	showToolbarOption?: boolean;
	allowCreate?: boolean;
}

interface Emits {
	(e: 'update:modelValue', value: string): void;
	(e: 'change', folder: BookmarkFolder | null): void;
	(e: 'submit'): void;
	(e: 'pending', pending: PendingFolder | null): void;
}

const props = withDefaults(defineProps<Props>(), {
	autofocus: true,
	autoSelectDefault: true,
	showToolbarOption: false,
	allowCreate: false,
});
const emit = defineEmits<Emits>();

const folderInput = ref<HTMLInputElement>();
const isInitializing = ref(true);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownItemRefs = ref<HTMLElement[]>([]);

const { allFolders, folderMap, toolbarId, loadFolders, parentPath } =
	useFolderTree();
const picker = useFolderPicker({
	folders: allFolders,
	modelValue: toRef(props, 'modelValue'),
	toolbarId,
	autoSelectDefault: props.autoSelectDefault,
	toolbarRowTitle: props.showToolbarOption
		? i18n.t('bookmarkToolbar')
		: undefined,
	onChange: (folder) => {
		emit('update:modelValue', folder?.id ?? '');
		emit('change', folder);
	},
	onSubmit: () => emit('submit'),
	onPending: props.allowCreate
		? (pending) => emit('pending', pending)
		: undefined,
});
const {
	inputText,
	isOpen,
	rows,
	matchCount,
	highlighted,
	expandedId,
	selected,
	pending,
	canCreate,
	scope,
} = picker;

const showPendingBadge = computed(
	() => pending.value !== null && inputText.value === pending.value.title,
);
const folderLabel = (id: string) =>
	id === toolbarId.value
		? i18n.t('bookmarkToolbar')
		: (folderMap.value.get(id)?.path ?? '');

const scopeChip = ref<HTMLElement>();
const scopeChipWidth = ref(0);
watch(scope, async () => {
	await nextTick();
	scopeChipWidth.value = scopeChip.value?.offsetWidth ?? 0;
});

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

.search-container .form-input.has-pending {
  padding-right: 100px;
}

.pending-badge {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-secondary);
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}

.scope-chip {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 45%;
  height: 26px;
  box-sizing: border-box;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent-secondary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}

.scope-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope-sep {
  color: var(--text-secondary);
  font-weight: 500;
}

.pending-path {
  margin: 6px 0 0 2px;
  font-size: 12px;
  color: var(--text-secondary);
}

.pending-path b {
  font-weight: 600;
  color: var(--text-primary);
}

.create-folder-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 28px;
  margin: -4px -6px -4px 0;
  padding: 2px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-weight: 600;
  color: var(--accent-secondary);
  cursor: pointer;
}

.create-folder-button:hover {
  background: var(--accent-soft);
}

.create-folder-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-folder-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: var(--accent-primary);
  color: var(--accent-text);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.create-folder-cta:hover {
  background: var(--accent-hover);
}

.create-folder-cta .key {
  background: rgba(255, 255, 255, 0.2);
  border-color: transparent;
  box-shadow: none;
  color: inherit;
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
  flex-shrink: 0;
  width: 14px;
  height: 14px;
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
