import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useFolderPicker } from '@/composables/useFolderPicker';
import type { BookmarkFolder } from '@/composables/useFolderTree';
import { createFolder } from '@/test-utils/bookmarkFactory';
import { stubLocalStorage } from '@/test-utils/localStorage';

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
	{ ...folder('recipes', 'Recipes'), parentId: 'toolbar' },
];

type Picker = ReturnType<typeof useFolderPicker>;

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
		toolbarId: ref('toolbar'),
		autoSelectDefault: false,
		onChange,
		onSubmit,
		...overrides,
		modelValue: overrides.modelValue ?? modelValue,
	});
	await picker.init();
	return { picker, modelValue, onChange, onSubmit };
};

const type = (picker: Picker, text: string) => {
	picker.inputText.value = text;
	picker.onInput();
};

const cache = stubLocalStorage();

beforeEach(() => {
	fakeBrowser.reset();
	cache.clear();
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

	it('starts from the cached fuzzy choice before init', () => {
		cache.set('searchmark_fuzzy_search', 'false');
		const picker = useFolderPicker({
			folders: ref(FOLDERS),
			toolbarId: ref('toolbar'),
			autoSelectDefault: false,
			onChange: vi.fn(),
			onSubmit: vi.fn(),
			modelValue: ref(''),
		});
		expect(picker.isFuzzy.value).toBe(false);
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

	describe('pending folder', () => {
		const setupCreate = async (
			overrides: Partial<Parameters<typeof useFolderPicker>[0]> = {},
		) => {
			const onPending = vi.fn();
			return { ...(await setup({ onPending, ...overrides })), onPending };
		};

		it('Shift+Enter makes the typed text a pending folder in the bookmark toolbar', async () => {
			const { picker, onPending, onChange } = await setupCreate();
			type(picker, ' tarts ');

			const event = key('Enter', true);
			expect(picker.onKeydown(event)).toBe(true);

			const pending = { title: 'tarts', parentId: 'toolbar' };
			expect(event.preventDefault).toHaveBeenCalled();
			expect(onPending).toHaveBeenCalledWith(pending);
			expect(picker.pending.value).toEqual(pending);
			expect(picker.selected.value).toBeNull();
			expect(onChange).toHaveBeenCalledWith(null);
			expect(picker.inputText.value).toBe('tarts');
			expect(picker.isOpen.value).toBe(false);
		});

		it.each([
			['with a toolbar row', 'Toolbar'],
			['without a toolbar row', undefined],
		])(
			'Enter with no folder match makes a pending folder %s, a second Enter submits',
			async (_, toolbarRowTitle) => {
				const { picker, onPending, onSubmit } = await setupCreate({
					toolbarRowTitle,
				});
				type(picker, 'tarts');

				picker.onKeydown(key('Enter'));
				await nextTick();

				expect(onPending).toHaveBeenCalledWith({
					title: 'tarts',
					parentId: 'toolbar',
				});
				expect(onSubmit).not.toHaveBeenCalled();
				expect(picker.pending.value?.title).toBe('tarts');
				expect(picker.inputText.value).toBe('tarts');

				picker.onKeydown(key('Enter'));
				expect(onSubmit).toHaveBeenCalledOnce();
				expect(picker.isOpen.value).toBe(false);
			},
		);

		it('replaces the selected folder and survives the cleared modelValue', async () => {
			const { picker, modelValue } = await setupCreate();
			picker.selectFolder(FOLDERS[2] as BookmarkFolder);
			await nextTick();

			type(picker, 'tarts');
			picker.onKeydown(key('Enter', true));
			await nextTick();

			expect(modelValue.value).toBe('');
			expect(picker.pending.value?.title).toBe('tarts');
			expect(picker.inputText.value).toBe('tarts');
		});

		it('is replaced by the created folder once it is in the tree and modelValue', async () => {
			const folders = ref([...FOLDERS]);
			const { picker, modelValue, onPending } = await setupCreate({ folders });
			type(picker, 'tarts');
			picker.onKeydown(key('Enter', true));

			folders.value = [
				...FOLDERS,
				{ ...folder('tarts', 'tarts'), parentId: 'toolbar' },
			];
			modelValue.value = 'tarts';
			await nextTick();

			expect(picker.pending.value).toBeNull();
			expect(onPending).toHaveBeenLastCalledWith(null);
			expect(picker.selected.value?.id).toBe('tarts');
			type(picker, 'Tarts');
			expect(picker.canCreate.value).toBe(false);
		});

		it.each([
			[
				'choosing a folder',
				(p: Picker) => {
					type(p, 'wine');
					p.onKeydown(key('Enter'));
				},
			],
			['clearing', (p: Picker) => p.clear()],
		])('%s drops the pending folder', async (_, act) => {
			const { picker, onPending } = await setupCreate();
			type(picker, 'tarts');
			picker.onKeydown(key('Enter', true));

			act(picker);

			expect(picker.pending.value).toBeNull();
			expect(onPending).toHaveBeenLastCalledWith(null);
		});

		it('a title already in the bookmark toolbar, ignoring case, cannot be created', async () => {
			const { picker, onPending, onChange } = await setupCreate();
			type(picker, 'RECIPES ');
			expect(picker.canCreate.value).toBe(false);

			picker.onKeydown(key('Enter', true));

			expect(onPending).not.toHaveBeenCalled();
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({ id: 'recipes' }),
			);
		});

		it('a title used outside the bookmark toolbar can be created', async () => {
			const { picker } = await setupCreate();
			type(picker, 'wine');

			expect(picker.canCreate.value).toBe(true);
		});

		it.each([
			['blur', (p: Picker) => p.onBlur()],
			['Escape', (p: Picker) => p.onKeydown(key('Escape'))],
		])(
			'%s restores the pending title after the query was changed',
			async (_, leave) => {
				const { picker } = await setupCreate();
				type(picker, 'tarts');
				picker.onKeydown(key('Enter', true));

				picker.onFocus();
				type(picker, 'wo');
				leave(picker);

				expect(picker.inputText.value).toBe('tarts');
				expect(picker.pending.value?.title).toBe('tarts');
			},
		);

		it('is off without onPending: Shift+Enter picks the highlighted folder, Enter with no match submits', async () => {
			const { picker, onChange, onSubmit } = await setup({
				toolbarRowTitle: 'Toolbar',
			});
			type(picker, 'wine');
			expect(picker.canCreate.value).toBe(false);
			picker.onKeydown(key('Enter', true));
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({ id: 'wine' }),
			);

			type(picker, 'tarts');
			picker.onKeydown(key('Enter'));
			expect(onSubmit).toHaveBeenCalledOnce();
			expect(picker.pending.value).toBeNull();
		});

		it('Enter with no folder match picks the bookmark toolbar row when it is highlighted', async () => {
			const { picker, onPending, onChange } = await setupCreate({
				toolbarRowTitle: 'Toolbar',
			});
			type(picker, 'tarts');
			picker.onKeydown(key('ArrowUp'));

			picker.onKeydown(key('Enter'));

			expect(onPending).not.toHaveBeenCalled();
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({ id: 'toolbar' }),
			);
		});
	});

	describe('scope', () => {
		const pies = createFolder({
			id: 'pies',
			title: 'Pies',
			parentId: 'kitchen',
		});
		const kitchen = createFolder({
			id: 'kitchen',
			title: 'Kitchen',
			parentId: 'home',
			children: [pies],
		});
		const home = createFolder({
			id: 'home',
			title: 'Home',
			parentId: 'toolbar',
			children: [kitchen],
		});
		const gardenPies = createFolder({
			id: 'garden-pies',
			title: 'Pies',
			parentId: 'garden',
		});
		const garden = createFolder({
			id: 'garden',
			title: 'Garden',
			parentId: 'toolbar',
			children: [gardenPies],
		});
		const TREE = [
			folder('toolbar', 'Bookmarks Bar', [home, garden]),
			home,
			kitchen,
			pies,
			garden,
			gardenPies,
		];

		const setupScope = async (
			overrides: Partial<Parameters<typeof useFolderPicker>[0]> = {},
		) => {
			const onPending = vi.fn();
			const result = await setup({
				folders: ref(TREE),
				toolbarRowTitle: 'Toolbar',
				onPending,
				...overrides,
			});
			return { ...result, onPending };
		};

		const enter = (picker: Picker, query: string) => {
			type(picker, query);
			return picker.onKeydown(key('/'));
		};

		it('"/" enters the highlighted folder and selects it', async () => {
			const { picker, onChange } = await setupScope();
			type(picker, 'kitch');
			const event = key('/');

			expect(picker.onKeydown(event)).toBe(true);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(picker.scope.value?.id).toBe('kitchen');
			expect(picker.selected.value?.id).toBe('kitchen');
			expect(onChange).toHaveBeenLastCalledWith(kitchen);
			expect(picker.inputText.value).toBe('');
			expect(picker.isOpen.value).toBe(true);
		});

		it('searches every descendant of the scope, without the toolbar row', async () => {
			const { picker } = await setupScope();
			enter(picker, 'home');

			type(picker, 'pies');

			expect(picker.rows.value.map((r) => r.folder.id)).toEqual(['pies']);
			expect(picker.highlighted.value.row).toBe(0);
			expect(picker.matchCount.value).toEqual({ current: 1, total: 1 });
		});

		it('keeps the list open when the query is erased inside a scope', async () => {
			const { picker } = await setupScope();
			enter(picker, 'home');
			type(picker, 'k');

			type(picker, '');

			expect(picker.isOpen.value).toBe(true);
			expect(picker.scope.value?.id).toBe('home');
		});

		it('lists the direct children of the scope on the empty input, none highlighted', async () => {
			const { picker, onSubmit, modelValue } = await setupScope();
			enter(picker, 'home');
			type(picker, 'k');

			type(picker, '');

			expect(picker.rows.value.map((r) => r.folder.id)).toEqual(['kitchen']);
			expect(picker.highlighted.value.row).toBe(-1);
			picker.onKeydown(key('Enter'));
			expect(onSubmit).toHaveBeenCalledOnce();
			expect(modelValue.value).toBe('home');
		});

		it('clear leaves the scope and closes the list', async () => {
			const { picker, modelValue } = await setupScope();
			enter(picker, 'home');
			type(picker, 'k');

			picker.clear();

			expect(picker.scope.value).toBeNull();
			expect(picker.isOpen.value).toBe(false);
			expect(picker.highlighted.value.row).toBe(-1);
			expect(modelValue.value).toBe('');
		});

		it('Shift+Enter creates a direct child of the scope and leaves it', async () => {
			const { picker, onPending } = await setupScope();
			enter(picker, 'home');
			type(picker, 'tarts');

			picker.onKeydown(key('Enter', true));

			expect(onPending).toHaveBeenLastCalledWith({
				title: 'tarts',
				parentId: 'home',
			});
			expect(picker.scope.value).toBeNull();
			expect(picker.isOpen.value).toBe(false);
		});

		it('blocks a title already in the scope, not one elsewhere', async () => {
			const { picker } = await setupScope();
			enter(picker, 'home');

			type(picker, 'KITCHEN');
			expect(picker.canCreate.value).toBe(false);
			type(picker, 'garden');
			expect(picker.canCreate.value).toBe(true);
		});

		it('Enter on the empty input saves into the scope', async () => {
			const { picker, onSubmit, modelValue } = await setupScope();
			enter(picker, 'home');

			picker.onKeydown(key('Enter'));

			expect(onSubmit).toHaveBeenCalledOnce();
			expect(modelValue.value).toBe('home');
		});

		it('Backspace on the empty input climbs to the parent, then leaves at the top', async () => {
			const { picker, onChange } = await setupScope();
			enter(picker, 'kitch');

			expect(picker.onKeydown(key('Backspace'))).toBe(true);
			expect(picker.scope.value?.id).toBe('home');
			expect(picker.selected.value?.id).toBe('home');
			expect(onChange).toHaveBeenLastCalledWith(home);

			picker.onKeydown(key('Backspace'));
			expect(picker.scope.value).toBeNull();
			expect(picker.selected.value?.id).toBe('toolbar');
			expect(onChange).toHaveBeenLastCalledWith(
				expect.objectContaining({ id: 'toolbar', title: 'Toolbar' }),
			);
			expect(picker.inputText.value).toBe('');
			expect(picker.isOpen.value).toBe(true);
		});

		it('Backspace is left to the input when it has text or there is no scope', async () => {
			const { picker } = await setupScope();
			type(picker, 'k');
			expect(picker.onKeydown(key('Backspace'))).toBe(false);

			enter(picker, 'kitch');
			type(picker, 'p');
			expect(picker.onKeydown(key('Backspace'))).toBe(false);
			expect(picker.scope.value?.id).toBe('kitchen');
		});

		it('"/" enters the highlighted child of an expanded row', async () => {
			const { picker } = await setupScope();
			type(picker, 'home');
			picker.onKeydown(key(' ', true));
			picker.onKeydown(key('ArrowDown'));

			picker.onKeydown(key('/'));

			expect(picker.scope.value?.id).toBe('kitchen');
		});

		it('"/" enters the highlighted child of the expanded toolbar row', async () => {
			const { picker } = await setupScope();
			type(picker, 'zzz');
			picker.onKeydown(key('ArrowUp'));
			picker.onKeydown(key(' ', true));
			picker.onKeydown(key('ArrowDown'));

			picker.onKeydown(key('/'));

			expect(picker.scope.value?.id).toBe('home');
		});

		it.each([
			['before typing', (p: Picker) => p.onFocus()],
			[
				'after Escape',
				(p: Picker) => {
					type(p, 'home');
					p.onKeydown(key('Escape'));
				},
			],
		])('"/" is swallowed while the list is closed (%s)', async (_, act) => {
			const { picker } = await setupScope();
			act(picker);
			const event = key('/');

			expect(picker.onKeydown(event)).toBe(true);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(picker.scope.value).toBeNull();
		});

		it('"/" on the toolbar row or on no row is swallowed and ignored', async () => {
			const { picker, onChange } = await setupScope();
			type(picker, 'zzz');
			const none = key('/');
			expect(picker.onKeydown(none)).toBe(true);
			expect(none.preventDefault).toHaveBeenCalled();

			picker.onKeydown(key('ArrowUp'));
			picker.onKeydown(key('/'));

			expect(picker.scope.value).toBeNull();
			expect(onChange).not.toHaveBeenCalled();
		});

		it('"/" is typed as text without onPending', async () => {
			const { picker } = await setupScope({ onPending: undefined });
			type(picker, 'home');

			expect(picker.onKeydown(key('/'))).toBe(false);
			expect(picker.scope.value).toBeNull();
		});

		it.each([
			['Escape', (p: Picker) => p.onKeydown(key('Escape'))],
			['blur', (p: Picker) => p.onBlur()],
			[
				'choosing a row',
				(p: Picker) => {
					type(p, 'pies');
					p.onKeydown(key('Enter'));
				},
			],
		])('%s leaves the scope, keeping the chosen folder', async (_, leave) => {
			const { picker } = await setupScope();
			enter(picker, 'home');

			leave(picker);

			expect(picker.scope.value).toBeNull();
			expect(picker.isOpen.value).toBe(false);
			expect(picker.inputText.value).toBe(picker.selected.value?.title);
		});
	});
});
