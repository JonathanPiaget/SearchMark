import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useFolderPicker } from '@/composables/useFolderPicker';
import type { BookmarkFolder } from '@/composables/useFolderTree';

vi.mock('@/utils/bookmark', () => ({
	getBookmarkToolbarId: async () => 'toolbar',
}));

const folder = (
	id: string,
	title = id,
	children?: BookmarkFolder[],
): BookmarkFolder => ({ id, title, path: '', children });

const FOLDERS = [
	folder('toolbar', 'Bookmarks Bar'),
	folder('work', 'Work', [
		folder('work-a', 'Work A'),
		folder('work-b', 'Work B'),
	]),
	folder('wine', 'Wine'),
	folder('work-a', 'Work A'),
	folder('work-b', 'Work B'),
];

const key = (key: string, shiftKey = false) => ({
	key,
	shiftKey,
	preventDefault: vi.fn(),
});

const setup = async (
	overrides: Partial<Parameters<typeof useFolderPicker>[0]> = {},
) => {
	const modelValue = ref('');
	const onChange = vi.fn((folder: BookmarkFolder | null) => {
		modelValue.value = folder?.id ?? '';
	});
	const onSubmit = vi.fn();
	const picker = useFolderPicker({
		folders: ref(FOLDERS),
		autoSelectDefault: false,
		onChange,
		onSubmit,
		...overrides,
		modelValue: overrides.modelValue ?? modelValue,
	});
	await picker.init();
	return { picker, modelValue, onChange, onSubmit };
};

const type = (picker: ReturnType<typeof useFolderPicker>, text: string) => {
	picker.inputText.value = text;
	picker.onInput();
};

beforeEach(() => {
	fakeBrowser.reset();
});

describe('useFolderPicker', () => {
	it('type, ArrowDown, Enter selects the second match and settles the input', async () => {
		const { picker, onChange } = await setup();

		type(picker, 'w');
		expect(picker.isOpen.value).toBe(true);
		expect(picker.highlighted.value.row).toBe(0);
		picker.onKeydown(key('ArrowDown'));
		picker.onKeydown(key('Enter'));

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'wine' }),
		);
		expect(picker.inputText.value).toBe('Wine');
		expect(picker.isOpen.value).toBe(false);
		expect(picker.selected.value?.id).toBe('wine');
	});

	it('ArrowDown clamps at the last row, ArrowUp clamps at the first', async () => {
		const { picker } = await setup();
		type(picker, 'wine');

		picker.onKeydown(key('ArrowDown'));
		expect(picker.highlighted.value.row).toBe(0);
		picker.onKeydown(key('ArrowUp'));
		expect(picker.highlighted.value.row).toBe(0);
	});

	it('ArrowUp at the first folder reaches the toolbar row; Enter selects it with the row title', async () => {
		const { picker, onChange } = await setup({ toolbarRowTitle: 'Toolbar' });

		type(picker, 'w');
		expect(picker.rows.value[0]?.kind).toBe('toolbar');
		expect(picker.highlighted.value.row).toBe(1);
		expect(picker.matchCount.value).toEqual({ current: 1, total: 4 });

		picker.onKeydown(key('ArrowUp'));
		expect(picker.highlighted.value.row).toBe(0);
		expect(picker.matchCount.value.current).toBe(0);

		picker.onKeydown(key('Enter'));
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'toolbar', title: 'Toolbar' }),
		);
		expect(picker.inputText.value).toBe('Toolbar');
	});

	it('toolbar row is reachable even when nothing matches', async () => {
		const { picker, onChange } = await setup({ toolbarRowTitle: 'Toolbar' });

		type(picker, 'zzz');
		expect(picker.highlighted.value.row).toBe(-1);
		picker.onKeydown(key('ArrowUp'));
		picker.onKeydown(key('Enter'));

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'toolbar' }),
		);
	});

	it('blur restores the selected title after the query was changed', async () => {
		const { picker } = await setup();
		type(picker, 'wine');
		picker.onKeydown(key('Enter'));

		picker.onFocus();
		expect(picker.inputText.value).toBe('');
		type(picker, 'wo');
		picker.onBlur();

		expect(picker.inputText.value).toBe('Wine');
		expect(picker.isOpen.value).toBe(false);
	});

	it('blur keeps the typed text when nothing is selected', async () => {
		const { picker } = await setup();
		type(picker, 'wo');
		picker.onBlur();

		expect(picker.inputText.value).toBe('wo');
	});

	it('external modelValue set to an id selects without firing onChange', async () => {
		const { picker, modelValue, onChange } = await setup();

		modelValue.value = 'wine';
		await nextTick();

		expect(picker.selected.value?.id).toBe('wine');
		expect(picker.inputText.value).toBe('Wine');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('external modelValue set to "" clears the selection', async () => {
		const { picker, modelValue } = await setup();
		type(picker, 'wine');
		picker.onKeydown(key('Enter'));
		await nextTick();

		modelValue.value = '';
		await nextTick();

		expect(picker.selected.value).toBeNull();
		expect(picker.inputText.value).toBe('');
	});

	it('init applies a preset modelValue without firing onChange', async () => {
		const modelValue = ref('work');
		const { picker, onChange } = await setup({ modelValue });

		expect(picker.selected.value?.id).toBe('work');
		expect(picker.inputText.value).toBe('Work');
		expect(onChange).not.toHaveBeenCalled();
	});

	it.each([
		['with a toolbar row', 'Toolbar', 'Toolbar'],
		['without a toolbar row', undefined, 'Bookmarks Bar'],
	])(
		'autoSelectDefault selects the toolbar %s',
		async (_, toolbarRowTitle, title) => {
			const { picker, onChange } = await setup({
				autoSelectDefault: true,
				toolbarRowTitle,
			});

			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({ id: 'toolbar', title }),
			);
			expect(picker.inputText.value).toBe(title);
		},
	);

	it('autoSelectDefault yields to a preset modelValue', async () => {
		const { onChange } = await setup({
			autoSelectDefault: true,
			modelValue: ref('wine'),
		});

		expect(onChange).not.toHaveBeenCalled();
	});

	it('Escape closes and clears the input when nothing is selected', async () => {
		const { picker } = await setup();
		type(picker, 'wo');

		expect(picker.onKeydown(key('Escape'))).toBe(true);

		expect(picker.isOpen.value).toBe(false);
		expect(picker.inputText.value).toBe('');
	});

	it('Escape restores the selected title', async () => {
		const { picker } = await setup();
		type(picker, 'wine');
		picker.onKeydown(key('Enter'));
		type(picker, 'wo');

		picker.onKeydown(key('Escape'));

		expect(picker.inputText.value).toBe('Wine');
	});

	it('prevents default on arrow keys and Enter, not on Escape', async () => {
		const { picker } = await setup();
		type(picker, 'w');

		for (const name of ['ArrowDown', 'ArrowUp', 'Enter']) {
			const event = key(name);
			type(picker, 'w');
			picker.onKeydown(event);
			expect(event.preventDefault, name).toHaveBeenCalled();
		}

		type(picker, 'w');
		const escapeEvent = key('Escape');
		picker.onKeydown(escapeEvent);
		expect(escapeEvent.preventDefault).not.toHaveBeenCalled();
	});

	it('returns false for keys it does not handle', async () => {
		const { picker } = await setup();
		type(picker, 'w');

		const space = key(' ');
		expect(picker.onKeydown(space)).toBe(false);
		expect(space.preventDefault).not.toHaveBeenCalled();
		expect(picker.onKeydown(key('a'))).toBe(false);
	});

	it('Shift+Space does nothing when no row is highlighted', async () => {
		const { picker } = await setup();
		type(picker, 'work');
		picker.highlight(-1);

		picker.onKeydown(key(' ', true));

		expect(picker.expandedId.value).toBeNull();
	});

	it('Shift+Space toggles expansion only for rows with children', async () => {
		const { picker } = await setup();

		type(picker, 'wine');
		picker.onKeydown(key(' ', true));
		expect(picker.expandedId.value).toBeNull();

		type(picker, 'work');
		picker.onKeydown(key(' ', true));
		expect(picker.expandedId.value).toBe('work');
		picker.onKeydown(key(' ', true));
		expect(picker.expandedId.value).toBeNull();
	});

	it('descends into children, then advances to the next row and collapses', async () => {
		const { picker } = await setup();
		type(picker, 'w');
		picker.onKeydown(key(' ', true));

		picker.onKeydown(key('ArrowDown'));
		expect(picker.highlighted.value).toEqual({ row: 0, child: 0 });
		picker.onKeydown(key('ArrowDown'));
		expect(picker.highlighted.value).toEqual({ row: 0, child: 1 });
		picker.onKeydown(key('ArrowDown'));
		expect(picker.highlighted.value).toEqual({ row: 1, child: -1 });
		expect(picker.expandedId.value).toBeNull();
	});

	it('climbs back out of children, leaving the parent highlighted and expanded', async () => {
		const { picker } = await setup();
		type(picker, 'w');
		picker.onKeydown(key(' ', true));
		picker.onKeydown(key('ArrowDown'));

		picker.onKeydown(key('ArrowUp'));

		expect(picker.highlighted.value).toEqual({ row: 0, child: -1 });
		expect(picker.expandedId.value).toBe('work');
	});

	it('Enter on a highlighted child selects the full folder', async () => {
		const { picker, onChange } = await setup();
		type(picker, 'w');
		picker.onKeydown(key(' ', true));
		picker.onKeydown(key('ArrowDown'));

		picker.onKeydown(key('Enter'));

		expect(onChange).toHaveBeenCalledWith(FOLDERS[3]);
		expect(picker.inputText.value).toBe('Work A');
	});

	it('Enter with the dropdown open and nothing highlighted submits', async () => {
		const { picker, onSubmit } = await setup();
		type(picker, 'w');
		picker.highlight(-1);

		picker.onKeydown(key('Enter'));

		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it('Enter with the dropdown closed submits only when something is selected', async () => {
		const { picker, onSubmit } = await setup();

		picker.onKeydown(key('Enter'));
		expect(onSubmit).not.toHaveBeenCalled();

		picker.selectFolder(FOLDERS[2] as BookmarkFolder);
		picker.onKeydown(key('Enter'));
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it('ArrowDown with the dropdown closed and a query reopens it on the first match', async () => {
		const { picker } = await setup();
		type(picker, 'w');
		picker.onKeydown(key('Escape'));
		picker.inputText.value = 'w';

		picker.onKeydown(key('ArrowDown'));

		expect(picker.isOpen.value).toBe(true);
		expect(picker.highlighted.value.row).toBe(0);
	});

	it('clear drops the selection and reports null', async () => {
		const { picker, onChange } = await setup();
		picker.selectFolder(FOLDERS[2] as BookmarkFolder);

		picker.clear();

		expect(picker.selected.value).toBeNull();
		expect(picker.inputText.value).toBe('');
		expect(onChange).toHaveBeenLastCalledWith(null);
	});

	it('persists the fuzzy preference and uses it for matching', async () => {
		await storage.setItem('local:searchmark_fuzzy_search', false);
		const { picker } = await setup();
		expect(picker.isFuzzy.value).toBe(false);

		type(picker, 'wn');
		expect(picker.rows.value).toHaveLength(0);

		picker.isFuzzy.value = true;
		await nextTick();
		expect(picker.rows.value.map((r) => r.folder.id)).toContain('wine');
		expect(await storage.getItem('local:searchmark_fuzzy_search')).toBe(true);
	});
});
