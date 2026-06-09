export const notify = (message: string): void => {
	browser.runtime.sendMessage({ type: 'NOTIFY', message }).catch(() => {});
};
