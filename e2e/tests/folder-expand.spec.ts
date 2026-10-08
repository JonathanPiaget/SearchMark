import { expect, test } from '../fixtures';
import { openPopup } from '../helpers';

test('expanding the only match keeps its last subfolder inside the popup', async ({
	context,
	serviceWorker,
	extensionId,
}) => {
	await serviceWorker.evaluate(async () => {
		const [tree] = await chrome.bookmarks.getTree();
		const toolbarId = tree?.children?.[0]?.id ?? '1';
		const course = await chrome.bookmarks.create({
			parentId: toolbarId,
			title: 'Cours compétences numériques',
		});
		for (const title of ['Activités', 'Illustrations', 'Ressources']) {
			await chrome.bookmarks.create({ parentId: course.id, title });
		}
	});

	const popup = await openPopup(context, extensionId);
	const input = popup.locator('#folder-search');
	await input.fill('compéte');
	await popup.waitForSelector('.dropdown-container');

	await input.press('Shift+Space');
	const children = popup.locator('.child-folder');
	await expect(children).toHaveCount(3);

	for (let i = 0; i < 3; i++) await input.press('ArrowDown');
	await expect(children.last()).toHaveClass(/highlighted/);

	await expect
		.poll(
			async () => {
				const popupBox = await popup.locator('.container').boundingBox();
				const childBox = await children.last().boundingBox();
				if (!popupBox || !childBox) throw new Error('missing box');
				return childBox.y + childBox.height - (popupBox.y + popupBox.height);
			},
			{ message: 'last subfolder overflows the popup by (px)' },
		)
		.toBeLessThanOrEqual(0);
});
