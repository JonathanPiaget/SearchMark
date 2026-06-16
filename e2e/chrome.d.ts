interface ChromeBookmarkNode {
	id: string;
	title: string;
	url?: string;
	parentId?: string;
	children?: ChromeBookmarkNode[];
}

interface ChromeBookmarkCreate {
	parentId?: string;
	title?: string;
	url?: string;
}

interface ChromeBookmarks {
	getTree(): Promise<ChromeBookmarkNode[]>;
	getChildren(id: string): Promise<ChromeBookmarkNode[]>;
	get(id: string): Promise<ChromeBookmarkNode[]>;
	create(bookmark: ChromeBookmarkCreate): Promise<ChromeBookmarkNode>;
	remove(id: string): Promise<void>;
	removeTree(id: string): Promise<void>;
}

interface ChromeTab {
	id?: number;
	url?: string;
	title?: string;
	active?: boolean;
}

interface ChromeTabs {
	query(info: Record<string, unknown>): Promise<ChromeTab[]>;
}

interface ChromeStorageArea {
	get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
	set(items: Record<string, unknown>): Promise<void>;
	remove(keys: string | string[]): Promise<void>;
}

interface ChromeAction {
	getBadgeText(details: { tabId?: number }): Promise<string>;
}

interface ChromePermissionsQuery {
	permissions?: string[];
	origins?: string[];
}

interface ChromePermissions {
	contains(query: ChromePermissionsQuery): Promise<boolean>;
	request(query: ChromePermissionsQuery): Promise<boolean>;
	remove(query: ChromePermissionsQuery): Promise<boolean>;
}

interface ChromeRuntime {
	sendMessage(message: unknown): Promise<unknown>;
}

declare const chrome: {
	bookmarks: ChromeBookmarks;
	tabs: ChromeTabs;
	storage: { local: ChromeStorageArea };
	action: ChromeAction;
	permissions: ChromePermissions;
	runtime: ChromeRuntime;
};

declare var __notificationPermissionChecks: boolean[] | undefined;

declare var __sentMessages: { type: string; message: string }[] | undefined;
