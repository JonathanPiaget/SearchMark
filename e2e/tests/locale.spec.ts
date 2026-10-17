import { expect, test } from '../fixtures';
import { openPopup, openSettings } from '../helpers';

test('choosing French in Settings translates the settings page and the popup', async ({
	context,
	extensionId,
}) => {
	const settings = await openSettings(context, extensionId);
	await settings.selectOption('#locale-select', 'fr');

	await expect(settings.locator('label[for="locale-select"]')).toHaveText(
		'Langue',
	);
	await expect(settings.locator('html')).toHaveAttribute('lang', 'fr');

	const popup = await openPopup(context, extensionId, {
		tab: { url: 'https://example.com', title: 'Example' },
	});
	await expect(popup.locator('.save-button')).toContainText(
		'Enregistrer le favori',
	);
	await expect(popup.locator('html')).toHaveAttribute('lang', 'fr');
});
