import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { openPopup } from '../helpers';

const focusIsIn = (popup: Page, selector: string): Promise<boolean> =>
	popup.evaluate(
		(sel) => Boolean(document.activeElement?.closest(sel)),
		selector,
	);

const activeTab = (popup: Page) =>
	popup.locator('.view-tabs .tab-button.active');

test('Alt+arrow and tab buttons switch views and move focus', async ({
	context,
	extensionId,
}) => {
	const popup = await openPopup(context, extensionId);

	await expect(activeTab(popup)).toContainText('Save');

	await popup.keyboard.press('Alt+ArrowRight');
	await expect(popup.locator('.search-view')).toBeVisible();
	await expect(activeTab(popup)).toContainText('Search');
	await expect.poll(() => focusIsIn(popup, '.search-view')).toBe(true);

	await popup.keyboard.press('Alt+ArrowLeft');
	await expect(activeTab(popup)).toContainText('Save');
	await expect.poll(() => focusIsIn(popup, '.save-view')).toBe(true);

	await popup.locator('.view-tabs .tab-button').nth(1).click();
	await expect(activeTab(popup)).toContainText('Search');
	await expect.poll(() => focusIsIn(popup, '.search-view')).toBe(true);

	await popup.locator('.view-tabs .tab-button').nth(0).click();
	await expect(activeTab(popup)).toContainText('Save');
	await expect.poll(() => focusIsIn(popup, '.save-view')).toBe(true);
});
