import type { Ref, ShallowRef } from 'vue';
import { nextTick, ref } from 'vue';
import type { BookmarkFolder } from './useFolderTree';

export interface KeyboardNavigationRefs {
	containerRef: Ref<HTMLElement | null> | ShallowRef<HTMLElement | null>;
	itemRefs: Ref<HTMLElement[]>;
}

export function useKeyboardNavigation(refs?: KeyboardNavigationRefs) {
	const highlightedIndex = ref(-1);
	const highlightedChildIndex = ref(-1);
	const showChildrenFor = ref<string | null>(null);

	const scrollIntoViewIfNeeded = (item: HTMLElement | undefined) => {
		if (!refs) return;

		const container = refs.containerRef.value;
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

	const scrollToIndex = (index: number) => {
		scrollIntoViewIfNeeded(refs?.itemRefs.value[index]);
	};

	const scrollToChild = (childIndex: number) => {
		if (!refs) return;
		const container = refs.containerRef.value;
		if (!container) return;
		nextTick(() => {
			const children = container.querySelectorAll<HTMLElement>('.child-folder');
			scrollIntoViewIfNeeded(children[childIndex]);
		});
	};

	const handleNavigation = (
		event: KeyboardEvent,
		searchResults: BookmarkFolder[],
		callbacks: {
			onEnter: (item: BookmarkFolder) => void;
			onEnterChild: (child: BookmarkFolder) => void;
			onEscape: () => void;
			onEmitEnter: () => void;
		},
	) => {
		const current = searchResults[highlightedIndex.value];
		const expandedChildren =
			current && showChildrenFor.value === current.id
				? (current.children ?? [])
				: [];

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (
				expandedChildren.length > 0 &&
				highlightedChildIndex.value < expandedChildren.length - 1
			) {
				highlightedChildIndex.value++;
				scrollToChild(highlightedChildIndex.value);
				return;
			}
			highlightedChildIndex.value = -1;
			showChildrenFor.value = null;
			const newIndex = Math.min(
				highlightedIndex.value + 1,
				searchResults.length - 1,
			);
			highlightedIndex.value = newIndex;
			scrollToIndex(newIndex);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (highlightedChildIndex.value >= 0) {
				highlightedChildIndex.value--;
				if (highlightedChildIndex.value >= 0) {
					scrollToChild(highlightedChildIndex.value);
				} else {
					scrollToIndex(highlightedIndex.value);
				}
				return;
			}
			showChildrenFor.value = null;
			const newIndex = Math.max(highlightedIndex.value - 1, 0);
			highlightedIndex.value = newIndex;
			scrollToIndex(newIndex);
		} else if (event.key === ' ' && event.shiftKey) {
			event.preventDefault();
			if (current?.children && current.children.length > 0) {
				showChildrenFor.value =
					showChildrenFor.value === current.id ? null : current.id;
				highlightedChildIndex.value = -1;
			}
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const highlightedChild = expandedChildren[highlightedChildIndex.value];
			if (highlightedChildIndex.value >= 0 && highlightedChild) {
				callbacks.onEnterChild(highlightedChild);
				return;
			}
			if (highlightedIndex.value >= 0 && current) {
				callbacks.onEnter(current);
				return;
			}
			callbacks.onEmitEnter();
		} else if (event.key === 'Escape') {
			callbacks.onEscape();
		}
	};

	const resetNavigation = () => {
		highlightedIndex.value = -1;
		highlightedChildIndex.value = -1;
		showChildrenFor.value = null;
	};

	return {
		highlightedIndex,
		highlightedChildIndex,
		showChildrenFor,
		handleNavigation,
		resetNavigation,
	};
}
