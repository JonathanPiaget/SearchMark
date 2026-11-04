import { expect, test } from '../fixtures';
import { openPopup } from '../helpers';

const TAB = {
	url: 'https://example.com/article?id=1&utm_source=x&fbclid=y',
	title: 'Example Article',
};

test('the Save view cleans tracking parameters and can restore them', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId, { tab: TAB });
	const note = popup.getByText('2 tracking parameters removed');

	await expect(popup.locator('#url')).toHaveValue(
		'https://example.com/article?id=1',
	);
	await expect(note).toBeVisible();

	await popup.getByRole('button', { name: 'Restore' }).click();

	await expect(popup.locator('#url')).toHaveValue(TAB.url);
	await expect(note).toBeHidden();
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
