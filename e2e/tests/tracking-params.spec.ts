import { expect, test } from '../fixtures';
import { getToolbarId, listBookmarks, openPopup, setStorage } from '../helpers';

const TAB = {
	url: 'https://example.com/article?id=1&utm_source=x&fbclid=y',
	title: 'Example Article',
};
const CLEAN_URL = 'https://example.com/article?id=1';

test('the Save view toggles tracking parameters and names them', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId, { tab: TAB });
	const note = popup.locator('.tracking-note');

	await expect(popup.locator('#url')).toHaveCount(0);
	await expect(note).toContainText('Tracking parameters removed');
	await expect(note.locator('.tracking-param')).toHaveText([
		'utm_source',
		'fbclid',
	]);

	await note.getByRole('button', { name: 'Restore' }).click();

	await expect(note).not.toContainText('removed');
	await expect(note.locator('.tracking-param')).toHaveText([
		'utm_source',
		'fbclid',
	]);

	await note.getByRole('button', { name: 'Remove' }).click();

	await expect(note).toContainText('Tracking parameters removed');
});

for (const { clicks, saved } of [
	{ clicks: [], saved: CLEAN_URL },
	{ clicks: ['Restore'], saved: TAB.url },
	{ clicks: ['Restore', 'Remove'], saved: CLEAN_URL },
]) {
	test(`saving after [${clicks.join(', ')}] stores ${saved}`, async ({
		context,
		serviceWorker,
		extensionId,
	}) => {
		const popup = await openPopup(context, extensionId, { tab: TAB });
		const note = popup.locator('.tracking-note');

		for (const name of clicks) {
			await note.getByRole('button', { name }).click();
		}
		await popup.locator('.save-button').click();

		const toolbarId = await getToolbarId(serviceWorker);
		await expect
			.poll(async () =>
				(await listBookmarks(serviceWorker, toolbarId)).map((b) => b.url),
			)
			.toEqual([saved]);
	});
}

test('the Save view shows no note when the url is already clean', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId, {
		tab: { url: 'https://example.com/article?id=1', title: 'Clean' },
	});

	await expect(popup.locator('#title')).toHaveValue('Clean');
	await expect(popup.locator('.tracking-note')).toHaveCount(0);
});

test('with the setting off, no note is shown and the raw url is saved', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await setStorage(serviceWorker, 'searchmark_stripTrackingParams', false);
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await expect(popup.locator('#title')).toHaveValue(TAB.title);
	await expect(popup.locator('.tracking-note')).toHaveCount(0);

	await popup.locator('.save-button').click();

	const toolbarId = await getToolbarId(serviceWorker);
	await expect
		.poll(async () =>
			(await listBookmarks(serviceWorker, toolbarId)).map((b) => b.url),
		)
		.toEqual([TAB.url]);
});
