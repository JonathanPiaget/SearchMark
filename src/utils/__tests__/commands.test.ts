import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { getOpenShortcut, getQuickSaveShortcut } from '@/utils/commands';

type Command = Browser.commands.Command;

interface CommandsApi {
	getAll(): Promise<Command[]>;
}

const commands = browser.commands as unknown as CommandsApi;

function mockCommands(list: Command[]): void {
	vi.spyOn(commands, 'getAll').mockResolvedValue(list);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getOpenShortcut', () => {
	it('resolves the MV3 _execute_action shortcut (Chrome)', async () => {
		mockCommands([{ name: '_execute_action', shortcut: 'Ctrl+Shift+X' }]);
		expect(await getOpenShortcut()).toBe('Ctrl+Shift+X');
	});

	it('resolves the MV2 _execute_browser_action shortcut (Firefox)', async () => {
		mockCommands([
			{ name: '_execute_browser_action', shortcut: 'Ctrl+Shift+X' },
		]);
		expect(await getOpenShortcut()).toBe('Ctrl+Shift+X');
	});

	it('returns undefined when the command has no bound shortcut', async () => {
		mockCommands([{ name: '_execute_action', shortcut: '' }]);
		expect(await getOpenShortcut()).toBeUndefined();
	});

	it('returns undefined when no open command exists', async () => {
		mockCommands([{ name: 'quick-save', shortcut: 'Ctrl+Shift+B' }]);
		expect(await getOpenShortcut()).toBeUndefined();
	});
});

describe('getQuickSaveShortcut', () => {
	it('resolves the quick-save shortcut', async () => {
		mockCommands([{ name: 'quick-save', shortcut: 'Ctrl+Shift+B' }]);
		expect(await getQuickSaveShortcut()).toBe('Ctrl+Shift+B');
	});

	it('returns undefined when quick-save is unbound', async () => {
		mockCommands([{ name: 'quick-save', shortcut: '' }]);
		expect(await getQuickSaveShortcut()).toBeUndefined();
	});

	it('returns undefined when no quick-save command exists', async () => {
		mockCommands([{ name: '_execute_action', shortcut: 'Ctrl+Shift+X' }]);
		expect(await getQuickSaveShortcut()).toBeUndefined();
	});
});
