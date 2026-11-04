import { cleanTabUrl } from '@/utils/trackingParams';

export const getCurrentTab = async (): Promise<{
	url: string;
	title: string;
	rawUrl: string;
	removedParams: string[];
}> => {
	const [tab] = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	if (!tab?.url) {
		throw new Error('No current tab');
	}
	const { url, removed } = await cleanTabUrl(tab.url);
	return {
		url,
		title: tab.title || url,
		rawUrl: tab.url,
		removedParams: removed,
	};
};
