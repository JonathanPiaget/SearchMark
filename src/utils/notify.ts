export type ExtensionMessage = { type: 'NOTIFY'; message: string };

export const notify = (message: string): void => {
	const payload: ExtensionMessage = { type: 'NOTIFY', message };
	browser.runtime.sendMessage(payload).catch(() => {});
};
