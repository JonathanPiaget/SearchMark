import { ref } from 'vue';
import type { BookmarkFolder } from './useFolderTree';

export function useKeyboardNavigation() {
	const highlightedIndex = ref(-1);
	const showChildrenFor = ref<string | null>(null);

	const scrollToHighlighted = () => {
		setTimeout(() => {
			const highlightedElement = document.querySelector(
				'.dropdown-item.highlighted',
			);
			const dropdownContainer = document.querySelector('.dropdown-container');

			if (highlightedElement && dropdownContainer) {
				const elementRect = highlightedElement.getBoundingClientRect();
				const containerRect = dropdownContainer.getBoundingClientRect();

				if (
					elementRect.top < containerRect.top ||
					elementRect.bottom > containerRect.bottom
				) {
					highlightedElement.scrollIntoView({
						behavior: 'smooth',
						block: 'nearest',
					});
				}
			}
		}, 0);
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
			highlightedIndex.value = Math.min(
				highlightedIndex.value + 1,
				searchResults.length - 1,
			);
			scrollToHighlighted();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			showChildrenFor.value = null;
			highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
			scrollToHighlighted();
		} else if (event.key === ' ' && event.shiftKey) {
			event.preventDefault();
			const currentItem = searchResults[highlightedIndex.value];
			if (currentItem?.children && currentItem.children.length > 0) {
				showChildrenFor.value =
					showChildrenFor.value === currentItem.id ? null : currentItem.id;
				setTimeout(() => scrollToHighlighted(), 100);
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
