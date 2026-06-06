import type { Ref } from 'vue';
import { nextTick, onUnmounted, ref, watch } from 'vue';

const POPUP_SELECTOR = '.container';
const FALLBACK_MAX_HEIGHT = 600;
const BOTTOM_MARGIN = 24;
const MIN_HEIGHT = 140;

/**
 * An absolutely-positioned dropdown never grows the extension popup window on
 * its own, so it gets clipped by the popup's bottom edge. This caps the dropdown
 * to the space left below its anchor and grows the popup just enough to fit it.
 */
export function useDropdownFit(
	isOpen: Ref<boolean>,
	anchor: Ref<HTMLElement | undefined>,
	dropdown: Ref<HTMLElement | null>,
) {
	const maxHeight = ref<number | null>(null);
	let popup: HTMLElement | null = null;

	const update = () => {
		popup = anchor.value?.closest<HTMLElement>(POPUP_SELECTOR) ?? null;
		if (!anchor.value || !popup) return;

		const limit =
			Number.parseFloat(getComputedStyle(popup).maxHeight) ||
			FALLBACK_MAX_HEIGHT;
		const offset =
			anchor.value.getBoundingClientRect().bottom -
			popup.getBoundingClientRect().top;
		maxHeight.value = Math.max(MIN_HEIGHT, limit - offset - BOTTOM_MARGIN);

		nextTick(() => {
			if (!popup || !dropdown.value) return;
			const needed = offset + dropdown.value.offsetHeight + BOTTOM_MARGIN;
			popup.style.minHeight = `${Math.min(limit, needed)}px`;
		});
	};

	const reset = () => {
		if (popup) popup.style.minHeight = '';
		popup = null;
		maxHeight.value = null;
	};

	watch(isOpen, (open) => (open ? update() : reset()));
	onUnmounted(reset);

	return { maxHeight, update };
}
