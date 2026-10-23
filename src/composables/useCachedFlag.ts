import { ref, watch } from 'vue';

// Mirrored in localStorage so the first paint shows the stored choice before storage answers.
export function useCachedFlag(key: string) {
	const item = storage.defineItem<boolean>(`local:${key}`, { fallback: true });
	const flag = ref(localStorage.getItem(key) !== 'false');

	watch(flag, (value) => {
		localStorage.setItem(key, String(value));
		item.setValue(value);
	});

	const load = async () => {
		flag.value = await item.getValue();
	};

	return { flag, load };
}
