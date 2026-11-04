import { expect, test } from '../fixtures';
import { openPopup } from '../helpers';

const TAB = {
	url: 'https://example.com/article?id=1&utm_source=x&fbclid=y',
	title: 'Example Article',
};

test('the Save view toggles tracking parameters and names them', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId, { tab: TAB });
	const url = popup.locator('#url');
	const note = popup.locator('.url-note');
	const clean = 'https://example.com/article?id=1';

	await expect(url).toHaveValue(clean);
	await expect(note).toContainText('Tracking parameters removed');
	await expect(note.locator('.tracking-param')).toHaveText([
		'utm_source',
		'fbclid',
	]);

	await note.getByRole('button', { name: 'Restore' }).click();

	await expect(url).toHaveValue(TAB.url);
	await expect(note).not.toContainText('removed');
	await expect(note.locator('.tracking-param')).toHaveText([
		'utm_source',
		'fbclid',
	]);

	await note.getByRole('button', { name: 'Remove' }).click();

	await expect(url).toHaveValue(clean);
	await expect(note).toContainText('Tracking parameters removed');
});

test('the note disappears once the url is edited by hand', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId, { tab: TAB });

	await popup.fill('#url', 'https://example.com/other');

	await expect(popup.locator('.url-note')).toHaveCount(0);
});

test('the Save view shows no note when the url is already clean', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId, {
		tab: { url: 'https://example.com/article?id=1', title: 'Clean' },
	});

	await expect(popup.locator('#url')).toHaveValue(
		'https://example.com/article?id=1',
	);
	await expect(popup.getByRole('button', { name: 'Restore' })).toHaveCount(0);
});
