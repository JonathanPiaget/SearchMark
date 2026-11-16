import type { Browser } from 'wxt/browser';
import { logError } from '@/utils/logger';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

export const joinFolderPath = (parentPath: string, title: string): string =>
	parentPath ? `${parentPath} > ${title}` : title;

const findBookmarksWithUrl = async (url: string) => {
	const matches = await browser.bookmarks.search({ url });
	return matches.filter((bookmark) => bookmark.url === url);
};

export const findBookmarksByUrl = async (...urls: string[]) => {
	try {
		const distinctUrls = [...new Set(urls.filter(Boolean))];
		return (await Promise.all(distinctUrls.map(findBookmarksWithUrl))).flat();
	} catch (error) {
		logError('Error searching bookmarks by URL', error);
		return [];
	}
};

export const findToolbarId = (tree: BookmarkTreeNode[]): string => {
	const roots = tree[0]?.children ?? [];
	const toolbar = navigator.userAgent.includes('Firefox')
		? (roots.find((node) => node.id === 'toolbar_____') ?? roots[1])
		: roots[0];
	return toolbar?.id ?? '1';
};

export const getBookmarkToolbarId = async (): Promise<string> => {
	try {
		return findToolbarId(await browser.bookmarks.getTree());
	} catch {
		return '1';
	}
};
