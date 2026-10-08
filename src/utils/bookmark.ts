import type { Browser } from 'wxt/browser';
import { logError } from '@/utils/logger';

type BookmarkTreeNode = Browser.bookmarks.BookmarkTreeNode;

export const joinFolderPath = (parentPath: string, title: string): string =>
	parentPath ? `${parentPath} > ${title}` : title;

export const findBookmarksByUrl = async (url: string) => {
	if (!url) return [];
	try {
		const matches = await browser.bookmarks.search({ url });
		return matches.filter((bookmark) => bookmark.url === url);
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
