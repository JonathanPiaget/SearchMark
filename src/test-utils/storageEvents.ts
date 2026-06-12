import { fakeBrowser } from 'wxt/testing';

type StorageChanges = Parameters<
	typeof fakeBrowser.storage.local.onChanged.trigger
>[0];

export function triggerStorageChange(
	area: 'local' | 'sync',
	changes: StorageChanges,
): Promise<unknown> {
	return fakeBrowser.storage[area].onChanged.trigger(changes);
}
