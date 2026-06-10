const initializedKeys = new Set<string>();

/**
 * Register a one-time listener that calls `onChange` with the new value
 * whenever `key` changes in the `local` storage area. Registration is
 * deduplicated per key, so repeated init() calls add only a single listener.
 */
export const useStorageSync = (
	key: string,
	onChange: (newValue: unknown) => void,
) => {
	if (initializedKeys.has(key) || !browser?.storage) {
		return;
	}

	browser.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === 'local' && changes[key]) {
			onChange(changes[key].newValue);
		}
	});
	initializedKeys.add(key);
};
