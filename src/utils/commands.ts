export const getOpenShortcut = async (): Promise<string | undefined> => {
	const commands = await browser.commands.getAll();
	const openCommand = commands.find(
		(c) => c.name === '_execute_action' || c.name === '_execute_browser_action',
	);
	return openCommand?.shortcut;
};
