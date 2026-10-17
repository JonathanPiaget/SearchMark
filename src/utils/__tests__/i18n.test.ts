import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { fetchMock, stubLocales, stubUiLanguage } from '@/test-utils/locales';
import { allTranslations, i18n, loadLocale, localeItem } from '@/utils/i18n';

beforeEach(() => {
	fakeBrowser.reset();
	stubLocales();
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
		stubUiLanguage(ui);
		await loadLocale();
		expect(fetchMock).toHaveBeenLastCalledWith(
			`chrome-extension://id/_locales/${lang}/messages.json`,
		);
	});

	it('uses the stored locale over the UI language', async () => {
		stubUiLanguage('fr-FR');
		await localeItem.setValue('en');
		await loadLocale();
		expect(i18n.t('save')).toBe('Save');
	});

	it('treats an unknown stored value as auto', async () => {
		stubUiLanguage('fr-FR');
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

describe('allTranslations', () => {
	it('returns the message in every language', async () => {
		await expect(allTranslations('seeLater')).resolves.toEqual([
			'See Later',
			'Voir plus tard',
		]);
	});
});
