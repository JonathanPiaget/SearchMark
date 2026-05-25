type ActionApi = typeof browser.action;

const namespaces = browser as unknown as {
	action?: ActionApi;
	browserAction?: ActionApi;
};

export const actionApi: ActionApi = (namespaces.action ??
	namespaces.browserAction) as ActionApi;
