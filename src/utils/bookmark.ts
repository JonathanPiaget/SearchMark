export const getBookmarkToolbarId = async (): Promise<string> => {
	try {
		const isFirefox = navigator.userAgent.includes('Firefox');

		if (isFirefox) {
			// Firefox: Try predefined toolbar ID first
			try {
				const toolbarNode = await browser.bookmarks.get('toolbar_____');
				if (toolbarNode?.[0]) {
					return 'toolbar_____';
				}
			} catch {
				// Fall back to tree position: [1] = Bookmarks Toolbar
				const [tree] = await browser.bookmarks.getTree();
				return tree.children?.[1]?.id || '1';
			}
			// If Firefox toolbar ID exists but is empty, fall back to tree
			const [tree] = await browser.bookmarks.getTree();
			return tree.children?.[1]?.id || '1';
		} else {
			// Chrome/Chromium: [0] = Bookmarks Toolbar
			const [tree] = await browser.bookmarks.getTree();
			return tree.children?.[0]?.id || '1';
		}
	} catch {
		return '1';
	}
};
