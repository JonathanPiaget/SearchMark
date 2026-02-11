import type { Ref, ShallowRef } from 'vue';
import { ref } from 'vue';
import type { BookmarkFolder } from './useFolderTree';

export interface KeyboardNavigationRefs {
	containerRef: Ref<HTMLElement | null> | ShallowRef<HTMLElement | null>;
	itemRefs: Ref<HTMLElement[]>;
}

export function useKeyboardNavigation(refs?: KeyboardNavigationRefs) {
	const highlightedIndex = ref(-1);
	const showChildrenFor = ref<string | null>(null);

	const scrollToIndex = (index: number) => {
		if (!refs) return;

		const container = refs.containerRef.value;
		const item = refs.itemRefs.value[index];

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

	const handleNavigation = (
		event: KeyboardEvent,
		searchResults: BookmarkFolder[],
		callbacks: {
			onEnter: (item: BookmarkFolder) => void;
			onEscape: () => void;
			onEmitEnter: () => void;
		},
	) => {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			showChildrenFor.value = null;
			const newIndex = Math.min(
				highlightedIndex.value + 1,
				searchResults.length - 1,
			);
			highlightedIndex.value = newIndex;
			scrollToIndex(newIndex);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			showChildrenFor.value = null;
			const newIndex = Math.max(highlightedIndex.value - 1, 0);
			highlightedIndex.value = newIndex;
			scrollToIndex(newIndex);
		} else if (event.key === ' ' && event.shiftKey) {
			event.preventDefault();
			const currentItem = searchResults[highlightedIndex.value];
			if (currentItem?.children && currentItem.children.length > 0) {
				showChildrenFor.value =
					showChildrenFor.value === currentItem.id ? null : currentItem.id;
			}
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (
				highlightedIndex.value >= 0 &&
				searchResults[highlightedIndex.value]
			) {
				callbacks.onEnter(searchResults[highlightedIndex.value]);
				return;
			}
			callbacks.onEmitEnter();
		} else if (event.key === 'Escape') {
			callbacks.onEscape();
		}
	};

	const resetNavigation = () => {
		highlightedIndex.value = -1;
		showChildrenFor.value = null;
	};

	return {
		highlightedIndex,
		showChildrenFor,
		handleNavigation,
		resetNavigation,
	};
}
