export const getCurrentTab = async (): Promise<{
	url: string;
	title: string;
}> => {
	const [tab] = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	if (!tab?.url) {
		throw new Error('No current tab');
	}
	return { url: tab.url, title: tab.title || tab.url };
};
