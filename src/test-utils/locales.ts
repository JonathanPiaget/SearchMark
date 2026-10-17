import { fileURLToPath } from 'node:url';
import { generateChromeMessages, parseMessagesFile } from '@wxt-dev/i18n/build';
import { vi } from 'vitest';
import { LANGUAGES, loadLanguage } from '@/utils/i18n';

const localesDir = fileURLToPath(new URL('../locales', import.meta.url));

const messagesByLanguage = Object.fromEntries(
	await Promise.all(
		LANGUAGES.map(async (language) => [
			language,
			generateChromeMessages(
				await parseMessagesFile(`${localesDir}/${language}.yml`),
			),
		]),
	),
);

export const fetchMock = vi.fn(async (url: string) => {
	const language = url.match(/_locales\/(\w+)\//)?.[1] ?? '';
	const messages = messagesByLanguage[language];
	if (!messages) throw new Error(`Unexpected fetch: ${url}`);
	return new Response(JSON.stringify(messages));
});

export function stubUiLanguage(uiLanguage: string) {
	vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue(uiLanguage);
}

/** Serves the real `_locales/<language>/messages.json` that WXT generates from src/locales, then loads it. */
export async function stubLocales() {
	fetchMock.mockClear();
	vi.spyOn(browser.runtime, 'getURL').mockImplementation(
		(path) => `chrome-extension://id${path}`,
	);
	vi.stubGlobal('fetch', fetchMock);
	stubUiLanguage('en-US');
	await loadLanguage();
}
