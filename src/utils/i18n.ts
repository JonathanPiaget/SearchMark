import type { GeneratedI18nStructure, i18n as wxtI18n } from '#i18n';

export type Locale = 'auto' | 'en' | 'fr';

export const localeItem = storage.defineItem<Locale>(
	'local:searchmark_locale',
	{
		fallback: 'auto',
	},
);

const LANGS = ['en', 'fr'] as const;
type Lang = (typeof LANGS)[number];
type Messages = Record<string, { message: string }>;

let messages: Messages | undefined;

function resolveLocale(locale: Locale): Lang {
	if (locale === 'en' || locale === 'fr') return locale;
	return browser.i18n.getUILanguage().startsWith('fr') ? 'fr' : 'en';
}

async function fetchMessages(lang: Lang): Promise<Messages> {
	const url = browser.runtime.getURL(`/_locales/${lang}/messages.json` as '/');
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Failed to load "${lang}" messages: HTTP ${response.status}`,
		);
	}
	return response.json();
}

export async function loadLocale(): Promise<void> {
	const lang = resolveLocale(await localeItem.getValue());
	messages = await fetchMessages(lang);
	if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

export async function allTranslations(
	key: keyof GeneratedI18nStructure,
): Promise<string[]> {
	const all = await Promise.all(LANGS.map(fetchMessages));
	return all.map((source) => lookup(source, key));
}

function lookup(source: Messages, key: string): string {
	const entry = source[key.replaceAll('.', '_')];
	if (!entry) throw new Error(`Message not found: "${key}"`);
	return entry.message;
}

function selectPlural(message: string, count: number): string {
	const forms = message.split(' | ');
	const index =
		forms.length === 1
			? 0
			: forms.length === 2
				? Number(count !== 1)
				: count === 0 || count === 1
					? count
					: 2;
	const form = forms.length <= 3 ? forms[index] : undefined;
	if (form === undefined) {
		throw new Error(`Unknown plural formatting: "${message}"`);
	}
	return form;
}

function t(key: string, ...args: unknown[]): string {
	if (!messages) throw new Error('loadLocale() must resolve before t()');
	let subs: unknown[] | undefined;
	let named: Record<string, unknown> | undefined;
	let count: number | undefined;
	for (const arg of args) {
		if (typeof arg === 'number') count = arg;
		else if (Array.isArray(arg)) subs = arg;
		else if (typeof arg === 'object' && arg != null)
			named = arg as Record<string, unknown>;
	}
	if (count != null && subs == null) subs = [count];

	const raw = lookup(messages, key);
	let message = count == null ? raw : selectPlural(raw, count);
	if (subs)
		message = message.replace(/\$([1-9])/g, (m, i) => String(subs[i - 1] ?? m));
	if (named) {
		message = message.replace(/\{([A-Za-z0-9_]+)\}/g, (m, name) =>
			Object.hasOwn(named, name) ? String(named[name]) : m,
		);
	}
	return message;
}

export const i18n = { t } as typeof wxtI18n;
