import { refreshAllBadges, updateBadgeForTab } from '../utils/badge';
import { getBookmarkToolbarId } from '../utils/bookmark';

export default defineBackground(() => {
	refreshAllBadges();

	browser.tabs.onActivated.addListener(async ({ tabId }) => {
		try {
			const tab = await browser.tabs.get(tabId);
			await updateBadgeForTab(tabId, tab.url);
		} catch (error) {
			console.error('Error handling tab activation:', error);
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

	browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message.action === 'saveBookmark') {
			(async () => {
				try {
					const toolbarId = await getBookmarkToolbarId();

					await browser.bookmarks.create({
						title: message.title,
						url: message.url,
						parentId: toolbarId,
					});

					sendResponse({ success: true });
				} catch (error) {
					console.error('Error saving bookmark:', error);
					sendResponse({ success: false, error: String(error) });
				}
			})();
			return true; // Indicates that the response will be sent asynchronously
		} else if (message.action === 'openPopup') {
			(async () => {
				try {
					await browser.action.openPopup();
					sendResponse({ success: true });
				} catch (error) {
					console.error('Error opening popup:', error);
					sendResponse({ success: false, error: String(error) });
				}
			})();
			return true; // Indicates that the response will be sent asynchronously
		}
	});
});
