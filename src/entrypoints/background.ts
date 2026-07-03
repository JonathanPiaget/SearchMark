import { i18n } from '#i18n';
import { refreshAllBadges, updateBadgeForTab } from '@/utils/badge';
import { logError } from '@/utils/logger';
import type { ExtensionMessage } from '@/utils/notify';
import { quickSaveCurrentTab } from '@/utils/quickSave';

const showNotification = async (message: string) => {
	const granted = await browser.permissions.contains({
		permissions: ['notifications'],
	});
	if (!granted) {
		return;
	}
	browser.notifications.create({
		type: 'basic',
		iconUrl: browser.runtime.getURL('/icon/128.png'),
		title: 'SearchMark',
		message,
	});
};

const quickSave = async () => {
	try {
		const { folderTitle } = await quickSaveCurrentTab();
		showNotification(
			i18n.t('seeLaterSuccess').replace('{folderName}', folderTitle),
		);
	} catch (error) {
		logError('Quick save failed', error);
		showNotification(i18n.t('seeLaterError'));
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
