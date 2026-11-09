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

const SYMBOLS: Record<string, string> = {
	command: '⌘',
	cmd: '⌘',
	ctrl: '⌃',
	control: '⌃',
	macctrl: '⌃',
	shift: '⇧',
	alt: '⌥',
	option: '⌥',
};

const tokenize = (shortcut: string): string[] => {
	if (shortcut.includes('+')) return shortcut.split('+');
	const symbols = ['⌘', '⌃', '⇧', '⌥'];
	const tokens: string[] = [];
	let rest = shortcut;
	while (rest && symbols.includes(rest.charAt(0))) {
		tokens.push(rest.charAt(0));
		rest = rest.slice(1);
	}
	if (rest) tokens.push(rest);
	return tokens;
};

export const shortcutKeys = (shortcut: string): string[] =>
	tokenize(shortcut).map((token) => SYMBOLS[token.toLowerCase()] ?? token);
