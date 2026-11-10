import { expect, test } from '../fixtures';
import { getToolbarId, listBookmarks, openPopup } from '../helpers';

const TAB = {
	url: 'https://example.com/article?id=1&utm_source=x&fbclid=y',
	title: 'Example Article',
};

test('the Save view toggles tracking parameters and names them', async ({
	context,
	serviceWorker,
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

	await note.getByRole('button', { name: 'Restore' }).click();
	await popup.locator('.save-button').click();

	const toolbarId = await getToolbarId(serviceWorker);
	await expect
		.poll(async () =>
			(await listBookmarks(serviceWorker, toolbarId)).map((b) => b.url),
		)
		.toContain(TAB.url);
});

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
