import { cleanTabUrl } from '@/utils/trackingParams';

const BLANK_PAGES = new Set([
	'about:blank',
	'about:newtab',
	'about:home',
	'about:privatebrowsing',
	'chrome://newtab/',
	'chrome://new-tab-page/',
	'edge://newtab/',
]);

export const isBlankPage = (url: string): boolean =>
	url === '' || BLANK_PAGES.has(url.toLowerCase());

export class NothingToSaveError extends Error {
	constructor() {
		super('Nothing to save on a blank page');
		this.name = 'NothingToSaveError';
	}
}

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
