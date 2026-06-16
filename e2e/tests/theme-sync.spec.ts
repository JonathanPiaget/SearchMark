import { expect, test } from '../fixtures';
import { openPopup, openSettings } from '../helpers';

const themeOf = (page: import('@playwright/test').Page) =>
	page.evaluate(() => document.documentElement.getAttribute('data-theme'));

test('changing the theme in Settings updates an open popup live', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId);
	await expect.poll(() => themeOf(popup)).not.toBeNull();

	const settings = await openSettings(context, extensionId);
	await settings.selectOption('#theme-select', 'dark');

	await expect.poll(() => themeOf(popup)).toBe('dark');

	await settings.selectOption('#theme-select', 'light');
	await expect.poll(() => themeOf(popup)).toBe('light');
});
