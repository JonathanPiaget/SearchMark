export const isMac = (): boolean => {
	return navigator.userAgent.includes('Mac');
};

export const isQuickSaveShortcut = (event: KeyboardEvent): boolean => {
	const mac = isMac();
	return mac
		? event.metaKey && event.shiftKey && event.key === 'b'
		: event.ctrlKey && event.shiftKey && event.key === 'b';
};
