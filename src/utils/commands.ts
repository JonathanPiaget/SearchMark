const getCommandShortcut = async (
	names: string[],
): Promise<string | undefined> => {
	const commands = await browser.commands.getAll();
	const command = commands.find((c) => names.includes(c.name ?? ''));
	return command?.shortcut || undefined;
};

export const getOpenShortcut = (): Promise<string | undefined> =>
	getCommandShortcut(['_execute_action', '_execute_browser_action']);

export const getQuickSaveShortcut = (): Promise<string | undefined> =>
	getCommandShortcut(['quick-save']);
