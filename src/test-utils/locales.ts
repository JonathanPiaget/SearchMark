import { fileURLToPath } from 'node:url';
import { generateChromeMessages, parseMessagesFile } from '@wxt-dev/i18n/build';
import { vi } from 'vitest';

const localesDir = fileURLToPath(new URL('../locales', import.meta.url));

const messagesByLang = {
	en: generateChromeMessages(await parseMessagesFile(`${localesDir}/en.yml`)),
	fr: generateChromeMessages(await parseMessagesFile(`${localesDir}/fr.yml`)),
};

export const fetchMock = vi.fn(async (url: string) => {
	const lang = url.match(
		/_locales\/(\w+)\//,
	)?.[1] as keyof typeof messagesByLang;
	return new Response(JSON.stringify(messagesByLang[lang]));
});

export function stubUiLanguage(lang: string) {
	vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue(lang);
}

/** Serves the real `_locales/<lang>/messages.json` that WXT generates from src/locales. */
export function stubLocales() {
	fetchMock.mockClear();
	vi.spyOn(browser.runtime, 'getURL').mockImplementation(
		(path) => `chrome-extension://id${path}`,
	);
	vi.stubGlobal('fetch', fetchMock);
	stubUiLanguage('en-US');
}
