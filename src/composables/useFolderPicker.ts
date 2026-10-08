import type { Ref } from 'vue';
import { computed, ref, watch } from 'vue';
import type { BookmarkFolder } from '@/composables/useFolderTree';
import { matchByTitle } from '@/utils/matchByTitle';

const MAX_RESULTS = 50;
const fuzzySearchItem = storage.defineItem<boolean>(
	'local:searchmark_fuzzy_search',
	{ fallback: true },
);

export interface PickerRow {
	kind: 'toolbar' | 'folder';
	folder: BookmarkFolder;
	indexes: readonly number[] | null;
}

export type PickerKeyEvent = Pick<
	KeyboardEvent,
	'key' | 'shiftKey' | 'preventDefault'
>;

export interface FolderPickerOptions {
	folders: Ref<BookmarkFolder[]>;
	modelValue: Ref<string>;
	toolbarId: Ref<string>;
	autoSelectDefault: boolean;
	toolbarRowTitle?: string;
	onChange: (folder: BookmarkFolder | null) => void;
	onSubmit: () => void;
}

export function useFolderPicker(options: FolderPickerOptions) {
	const { folders, modelValue } = options;
	const inputText = ref('');
	const isOpen = ref(false);
	const isFuzzy = ref(true);
	const selected = ref<BookmarkFolder | null>(null);
	const highlighted = ref({ row: -1, child: -1 });
	const expandedId = ref<string | null>(null);

	const findFolder = (id: string) => folders.value.find((f) => f.id === id);
	const toolbar = computed(() => findFolder(options.toolbarId.value) ?? null);

	const toolbarRow = computed<PickerRow | null>(() =>
		toolbar.value && options.toolbarRowTitle !== undefined
			? {
					kind: 'toolbar',
					folder: { ...toolbar.value, title: options.toolbarRowTitle },
					indexes: null,
				}
			: null,
	);

	const rows = computed<PickerRow[]>(() => {
		const matches = matchByTitle(
			folders.value,
			inputText.value,
			isFuzzy.value,
			MAX_RESULTS,
		).map(({ item, indexes }) => ({
			kind: 'folder' as const,
			folder: item,
			indexes,
		}));
		return toolbarRow.value ? [toolbarRow.value, ...matches] : matches;
	});

	const matchCount = computed(() => {
		const offset = toolbarRow.value ? 1 : 0;
		return {
			current: Math.max(0, highlighted.value.row + 1 - offset),
			total: rows.value.length - offset,
		};
	});

	const highlight = (row: number, child = -1) => {
		highlighted.value = { row, child };
	};
	const highlightFirstFolder = () =>
		highlight(rows.value.findIndex((r) => r.kind === 'folder'));

	const close = () => {
		isOpen.value = false;
		highlight(-1);
		expandedId.value = null;
	};

	const open = () => {
		isOpen.value = true;
		highlightFirstFolder();
	};

	const settle = () => {
		inputText.value = selected.value?.title ?? '';
	};

	const apply = (folder: BookmarkFolder | null) => {
		selected.value = folder;
		settle();
	};

	const commit = (folder: BookmarkFolder) => {
		apply(folder);
		close();
		options.onChange(folder);
	};
	const select = (row: PickerRow) => commit(row.folder);
	const selectFolder = (folder: BookmarkFolder) =>
		commit(findFolder(folder.id) ?? folder);

	const clear = () => {
		apply(null);
		options.onChange(null);
	};

	const init = async () => {
		isFuzzy.value = await fuzzySearchItem.getValue();
		if (modelValue.value) apply(findFolder(modelValue.value) ?? null);

		if (options.autoSelectDefault && !modelValue.value) {
			if (toolbarRow.value) select(toolbarRow.value);
			else if (toolbar.value) selectFolder(toolbar.value);
		}
	};

	const onInput = () => {
		isOpen.value = inputText.value.trim().length > 0;
		highlightFirstFolder();
	};

	const onFocus = () => {
		inputText.value = '';
		isOpen.value = false;
	};

	const onBlur = () => {
		close();
		if (selected.value) inputText.value = selected.value.title;
	};

	const currentRow = () => rows.value[highlighted.value.row];
	const expandedChildren = () => {
		const row = currentRow();
		return row && expandedId.value === row.folder.id
			? (row.folder.children ?? [])
			: [];
	};

	const moveDown = () => {
		const { row, child } = highlighted.value;
		if (child < expandedChildren().length - 1) {
			highlight(row, child + 1);
			return;
		}
		expandedId.value = null;
		highlight(Math.min(row + 1, rows.value.length - 1));
	};

	const moveUp = () => {
		const { row, child } = highlighted.value;
		if (child >= 0) {
			highlight(row, child - 1);
			return;
		}
		expandedId.value = null;
		highlight(Math.max(row - 1, 0));
	};

	const toggleExpand = () => {
		const row = currentRow();
		if (!row?.folder.children?.length) return;
		expandedId.value =
			expandedId.value === row.folder.id ? null : row.folder.id;
		highlight(highlighted.value.row);
	};

	const confirm = () => {
		const child = expandedChildren()[highlighted.value.child];
		const row = currentRow();
		if (child) selectFolder(child);
		else if (row) select(row);
		else options.onSubmit();
	};

	const onKeydown = (event: PickerKeyEvent): boolean => {
		if (
			!isOpen.value &&
			inputText.value.trim() &&
			(event.key === 'ArrowDown' || (event.key === 'Enter' && !selected.value))
		) {
			open();
			return true;
		}

		if (isOpen.value && rows.value.length > 0) {
			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					moveDown();
					return true;
				case 'ArrowUp':
					event.preventDefault();
					moveUp();
					return true;
				case ' ':
					if (!event.shiftKey) return false;
					event.preventDefault();
					toggleExpand();
					return true;
				case 'Enter':
					event.preventDefault();
					confirm();
					return true;
			}
		}

		if (event.key === 'Enter') {
			if (selected.value) options.onSubmit();
			return true;
		}
		if (event.key === 'Escape') {
			close();
			settle();
			return true;
		}
		return false;
	};

	watch(modelValue, (id) => {
		if (!id) apply(null);
		else if (selected.value?.id !== id) {
			const folder = findFolder(id);
			if (folder) apply(folder);
		}
	});

	watch(isFuzzy, (value) => {
		fuzzySearchItem.setValue(value);
	});

	return {
		inputText,
		isOpen,
		isFuzzy,
		rows,
		matchCount,
		highlighted,
		expandedId,
		selected,
		init,
		onInput,
		onFocus,
		onBlur,
		onKeydown,
		highlight,
		select,
		selectFolder,
		clear,
	};
}
