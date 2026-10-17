import { fileURLToPath } from 'node:url';
import { generateChromeMessages, parseMessagesFile } from '@wxt-dev/i18n/build';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { i18n, loadLocale, localeItem } from '@/utils/i18n';

const localesDir = fileURLToPath(new URL('../../locales', import.meta.url));

const messagesByLang = {
	en: generateChromeMessages(await parseMessagesFile(`${localesDir}/en.yml`)),
	fr: generateChromeMessages(await parseMessagesFile(`${localesDir}/fr.yml`)),
};

const fetchMock = vi.fn(async (url: string) => {
	const lang = url.match(
		/_locales\/(\w+)\//,
	)?.[1] as keyof typeof messagesByLang;
	return new Response(JSON.stringify(messagesByLang[lang]));
});

function uiLanguage(lang: string) {
	vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue(lang);
}

beforeEach(() => {
	fakeBrowser.reset();
	vi.spyOn(browser.runtime, 'getURL').mockImplementation(
		(path) => `chrome-extension://id${path}`,
	);
	vi.stubGlobal('fetch', fetchMock);
	uiLanguage('en-US');
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('loadLocale', () => {
	it.each([
		['fr-CA', 'fr'],
		['fr', 'fr'],
		['de', 'en'],
		['en-GB', 'en'],
	])('resolves auto with UI language %s to %s', async (ui, lang) => {
		uiLanguage(ui);
		await loadLocale();
		expect(fetchMock).toHaveBeenLastCalledWith(
			`chrome-extension://id/_locales/${lang}/messages.json`,
		);
	});

	it('uses the stored locale over the UI language', async () => {
		uiLanguage('fr-FR');
		await localeItem.setValue('en');
		await loadLocale();
		expect(i18n.t('save')).toBe('Save');
	});

	it('treats an unknown stored value as auto', async () => {
		uiLanguage('fr-FR');
		await browser.storage.local.set({ searchmark_locale: 'de' });
		await loadLocale();
		expect(i18n.t('save')).toBe('Enregistrer');
	});

	it('throws when the messages cannot be fetched', async () => {
		fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
		await expect(loadLocale()).rejects.toThrow('HTTP 404');
	});
});

describe('t', () => {
	beforeEach(async () => {
		await localeItem.setValue('fr');
		await loadLocale();
	});

	it('picks the plural form and substitutes the count', () => {
		expect(i18n.t('childCount', 0)).toBe('0 enfant');
		expect(i18n.t('childCount', 1)).toBe('1 enfant');
		expect(i18n.t('childCount', 5)).toBe('5 enfants');
		expect(i18n.t('moreResults', 1)).toBe('1 autre résultat…');
		expect(i18n.t('moreResults', 3)).toBe('3 autres résultats…');
	});

	it('substitutes positional arguments', () => {
		expect(i18n.t('themeLabel', ['Sombre'])).toBe('Thème : Sombre');
	});

	it('substitutes named arguments', () => {
		expect(i18n.t('bookmarkSavedInFolder', { folderName: 'Docs' })).toBe(
			'Favori enregistré dans « Docs »',
		);
	});
});
