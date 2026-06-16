import { expect, test } from '../fixtures';
import { openPopup } from '../helpers';

test('notifications are suppressed while the permission is revoked', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	const granted = await serviceWorker.evaluate(() =>
		chrome.permissions.contains({ permissions: ['notifications'] }),
	);
	expect(granted).toBe(false);

	await serviceWorker.evaluate(() => {
		globalThis.__notificationPermissionChecks = [];
		const original = chrome.permissions.contains.bind(chrome.permissions);
		chrome.permissions.contains = async (query) => {
			const result = await original(query);
			if (query.permissions?.includes('notifications')) {
				globalThis.__notificationPermissionChecks?.push(result);
			}
			return result;
		};
	});

	const popup = await openPopup(context, extensionId);
	await popup.evaluate(() =>
		chrome.runtime.sendMessage({ type: 'NOTIFY', message: 'hello' }),
	);

	await expect
		.poll(() =>
			serviceWorker.evaluate(
				() => globalThis.__notificationPermissionChecks ?? [],
			),
		)
		.toContain(false);
});
