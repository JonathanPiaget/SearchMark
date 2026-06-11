import { describe, expect, it, vi } from 'vitest';
import type { BookmarkFolder } from '@/composables/useFolderTree';
import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation';

function folder(id: string, children?: BookmarkFolder[]): BookmarkFolder {
	return { id, title: id, path: '', children };
}

function keyEvent(key: string, shiftKey = false) {
	return {
		key,
		shiftKey,
		preventDefault: vi.fn(),
	} as unknown as KeyboardEvent;
}

function callbacks() {
	return {
		onEnter: vi.fn(),
		onEnterChild: vi.fn(),
		onEscape: vi.fn(),
		onEmitEnter: vi.fn(),
	};
}

describe('handleNavigation — ArrowDown / ArrowUp clamping', () => {
	it('moves down and clamps at the last index', () => {
		const nav = useKeyboardNavigation();
		const results = [folder('a'), folder('b')];

		nav.handleNavigation(keyEvent('ArrowDown'), results, callbacks());
		expect(nav.highlightedIndex.value).toBe(0);
		nav.handleNavigation(keyEvent('ArrowDown'), results, callbacks());
		expect(nav.highlightedIndex.value).toBe(1);
		nav.handleNavigation(keyEvent('ArrowDown'), results, callbacks());
		expect(nav.highlightedIndex.value).toBe(1);
	});

	it('moves up from the initial -1 to 0 and clamps there', () => {
		const nav = useKeyboardNavigation();
		const results = [folder('a'), folder('b')];

		nav.handleNavigation(keyEvent('ArrowUp'), results, callbacks());
		expect(nav.highlightedIndex.value).toBe(0);
		nav.handleNavigation(keyEvent('ArrowUp'), results, callbacks());
		expect(nav.highlightedIndex.value).toBe(0);
	});

	it('calls preventDefault on arrow keys', () => {
		const nav = useKeyboardNavigation();
		const event = keyEvent('ArrowDown');

		nav.handleNavigation(event, [folder('a')], callbacks());

		expect(event.preventDefault).toHaveBeenCalled();
	});
});

describe('handleNavigation — Shift+Space expansion', () => {
	it('toggles expansion for the highlighted folder with children', () => {
		const nav = useKeyboardNavigation();
		const results = [folder('a', [folder('c1')])];

		nav.handleNavigation(keyEvent('ArrowDown'), results, callbacks());
		nav.handleNavigation(keyEvent(' ', true), results, callbacks());
		expect(nav.showChildrenFor.value).toBe('a');

		nav.handleNavigation(keyEvent(' ', true), results, callbacks());
		expect(nav.showChildrenFor.value).toBeNull();
	});

	it('does nothing when the highlighted folder has no children', () => {
		const nav = useKeyboardNavigation();
		const results = [folder('a')];

		nav.handleNavigation(keyEvent('ArrowDown'), results, callbacks());
		nav.handleNavigation(keyEvent(' ', true), results, callbacks());

		expect(nav.showChildrenFor.value).toBeNull();
	});

	it('does nothing when no folder is highlighted', () => {
		const nav = useKeyboardNavigation();
		const results = [folder('a', [folder('c1')])];

		nav.handleNavigation(keyEvent(' ', true), results, callbacks());

		expect(nav.showChildrenFor.value).toBeNull();
	});
});

describe('handleNavigation — child traversal', () => {
	const results = () => [
		folder('a', [folder('c1'), folder('c2')]),
		folder('b'),
	];

	function expanded(nav: ReturnType<typeof useKeyboardNavigation>) {
		const r = results();
		nav.handleNavigation(keyEvent('ArrowDown'), r, callbacks());
		nav.handleNavigation(keyEvent(' ', true), r, callbacks());
		return r;
	}

	it('descends into children, then advances to the next parent and collapses', () => {
		const nav = useKeyboardNavigation();
		const r = expanded(nav);

		nav.handleNavigation(keyEvent('ArrowDown'), r, callbacks());
		expect(nav.highlightedChildIndex.value).toBe(0);
		nav.handleNavigation(keyEvent('ArrowDown'), r, callbacks());
		expect(nav.highlightedChildIndex.value).toBe(1);

		nav.handleNavigation(keyEvent('ArrowDown'), r, callbacks());
		expect(nav.highlightedChildIndex.value).toBe(-1);
		expect(nav.showChildrenFor.value).toBeNull();
		expect(nav.highlightedIndex.value).toBe(1);
	});

	it('climbs back out of children, leaving the parent highlighted', () => {
		const nav = useKeyboardNavigation();
		const r = expanded(nav);
		nav.handleNavigation(keyEvent('ArrowDown'), r, callbacks());

		nav.handleNavigation(keyEvent('ArrowUp'), r, callbacks());

		expect(nav.highlightedChildIndex.value).toBe(-1);
		expect(nav.highlightedIndex.value).toBe(0);
		expect(nav.showChildrenFor.value).toBe('a');
	});
});

describe('handleNavigation — Enter', () => {
	it('calls onEnterChild for a highlighted child', () => {
		const nav = useKeyboardNavigation();
		const cb = callbacks();
		const r = [folder('a', [folder('c1')])];
		nav.handleNavigation(keyEvent('ArrowDown'), r, cb);
		nav.handleNavigation(keyEvent(' ', true), r, cb);
		nav.handleNavigation(keyEvent('ArrowDown'), r, cb);

		nav.handleNavigation(keyEvent('Enter'), r, cb);

		expect(cb.onEnterChild).toHaveBeenCalledWith(r[0].children?.[0]);
		expect(cb.onEnter).not.toHaveBeenCalled();
	});

	it('calls onEnter for the highlighted parent', () => {
		const nav = useKeyboardNavigation();
		const cb = callbacks();
		const r = [folder('a')];
		nav.handleNavigation(keyEvent('ArrowDown'), r, cb);

		nav.handleNavigation(keyEvent('Enter'), r, cb);

		expect(cb.onEnter).toHaveBeenCalledWith(r[0]);
		expect(cb.onEmitEnter).not.toHaveBeenCalled();
	});

	it('calls onEmitEnter when nothing is highlighted', () => {
		const nav = useKeyboardNavigation();
		const cb = callbacks();

		nav.handleNavigation(keyEvent('Enter'), [folder('a')], cb);

		expect(cb.onEmitEnter).toHaveBeenCalled();
		expect(cb.onEnter).not.toHaveBeenCalled();
	});
});

describe('handleNavigation — Escape', () => {
	it('calls onEscape without preventing default', () => {
		const nav = useKeyboardNavigation();
		const cb = callbacks();
		const event = keyEvent('Escape');

		nav.handleNavigation(event, [folder('a')], cb);

		expect(cb.onEscape).toHaveBeenCalled();
		expect(event.preventDefault).not.toHaveBeenCalled();
	});
});

describe('resetNavigation', () => {
	it('resets all navigation state', () => {
		const nav = useKeyboardNavigation();
		const r = [folder('a', [folder('c1')])];
		nav.handleNavigation(keyEvent('ArrowDown'), r, callbacks());
		nav.handleNavigation(keyEvent(' ', true), r, callbacks());
		nav.handleNavigation(keyEvent('ArrowDown'), r, callbacks());

		nav.resetNavigation();

		expect(nav.highlightedIndex.value).toBe(-1);
		expect(nav.highlightedChildIndex.value).toBe(-1);
		expect(nav.showChildrenFor.value).toBeNull();
	});
});
