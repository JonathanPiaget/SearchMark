import type { GeneratedI18nStructure, i18n as wxtI18n } from '#i18n';

export const LANGUAGES = ['en', 'fr'] as const;
type ResolvedLanguage = (typeof LANGUAGES)[number];
export type Language = 'auto' | ResolvedLanguage;

export const languageItem = storage.defineItem<Language>(
	'local:searchmark_language',
	{
		fallback: 'auto',
	},
);

type Messages = Record<string, { message: string }>;

let messages: Messages | undefined;
const cache = new Map<ResolvedLanguage, Messages>();

function resolveLanguage(language: Language): ResolvedLanguage {
	const chosen = LANGUAGES.find((candidate) => candidate === language);
	if (chosen) return chosen;
	const uiLanguage = browser.i18n.getUILanguage();
	return (
		LANGUAGES.find((candidate) => uiLanguage.startsWith(candidate)) ?? 'en'
	);
}

async function fetchMessages(language: ResolvedLanguage): Promise<Messages> {
	const cached = cache.get(language);
	if (cached) return cached;
	// WXT writes _locales at build time, so it is missing from its typed public paths
	const url = browser.runtime.getURL(
		`/_locales/${language}/messages.json` as '/',
	);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Failed to load "${language}" messages: HTTP ${response.status}`,
		);
	}
	const loaded: Messages = await response.json();
	cache.set(language, loaded);
	return loaded;
}

export async function loadLanguage(): Promise<void> {
	const language = resolveLanguage(await languageItem.getValue());
	messages = await fetchMessages(language);
	if (typeof document !== 'undefined') document.documentElement.lang = language;
}

export async function allTranslations(
	key: keyof GeneratedI18nStructure,
): Promise<string[]> {
	const all = await Promise.all(LANGUAGES.map(fetchMessages));
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
	if (!messages) throw new Error('loadLanguage() must resolve before t()');
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
