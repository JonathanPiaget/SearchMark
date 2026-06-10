import { actionApi } from './action';
import { findBookmarksByUrl } from './bookmark';
import { logError } from './logger';

const BOOKMARKED_BADGE_TEXT = '✓';
const BOOKMARKED_BADGE_COLOR = '#7f45e5';

export const updateBadgeForTab = async (
	tabId: number,
	url: string | undefined,
): Promise<void> => {
	try {
		const isBookmarked = !!url && (await findBookmarksByUrl(url)).length > 0;
		await actionApi.setBadgeText({
			text: isBookmarked ? BOOKMARKED_BADGE_TEXT : '',
			tabId,
		});
		if (isBookmarked) {
			await actionApi.setBadgeBackgroundColor({
				color: BOOKMARKED_BADGE_COLOR,
				tabId,
			});
		}
	} catch (error) {
		logError('Error updating bookmark badge', error);
	}
};

export const refreshAllBadges = async (): Promise<void> => {
	const tabs = await browser.tabs.query({});
	await Promise.all(
		tabs
			.filter((tab): tab is typeof tab & { id: number } => tab.id !== undefined)
			.map((tab) => updateBadgeForTab(tab.id, tab.url)),
	);
};
