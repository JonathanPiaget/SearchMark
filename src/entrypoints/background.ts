import { i18n } from '#i18n';
import { refreshAllBadges, updateBadgeForTab } from '../utils/badge';
import { getBookmarkToolbarId } from '../utils/bookmark';
import { logError } from '../utils/logger';
import type { ExtensionMessage } from '../utils/notify';

const showNotification = (message: string) => {
	browser.notifications.create({
		type: 'basic',
		iconUrl: browser.runtime.getURL('/icon/128.png'),
		title: 'SearchMark',
		message,
	});
};

const quickSave = async () => {
	try {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (!tab?.url) {
			throw new Error('No active tab to save');
		}

		const toolbarId = await getBookmarkToolbarId();
		await browser.bookmarks.create({
			title: tab.title || tab.url,
			url: tab.url,
			parentId: toolbarId,
		});

		showNotification(i18n.t('bookmarkSaved'));
	} catch (error) {
		logError('Quick save failed', error);
		showNotification(i18n.t('bookmarkError'));
	}
};

export default defineBackground(() => {
	refreshAllBadges();

	browser.tabs.onActivated.addListener(async ({ tabId }) => {
		try {
			const tab = await browser.tabs.get(tabId);
			await updateBadgeForTab(tabId, tab.url);
		} catch (error) {
			logError('Error handling tab activation', error);
		}
	});

	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (changeInfo.url !== undefined || changeInfo.status === 'complete') {
			updateBadgeForTab(tabId, changeInfo.url ?? tab.url);
		}
	});

	browser.bookmarks.onCreated.addListener(refreshAllBadges);
	browser.bookmarks.onRemoved.addListener(refreshAllBadges);
	browser.bookmarks.onChanged.addListener(refreshAllBadges);

	browser.commands.onCommand.addListener((command) => {
		if (command === 'quick-save') {
			quickSave();
		}
	});

	browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
		if (message.type === 'NOTIFY') {
			showNotification(message.message);
		}
	});
});
