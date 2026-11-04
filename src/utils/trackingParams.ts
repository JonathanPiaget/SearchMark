export interface StrippedUrl {
	url: string;
	removed: string[];
}

const TRACKING_PARAMS = new Set([
	'fbclid',
	'gclid',
	'dclid',
	'gbraid',
	'wbraid',
	'msclkid',
	'mc_cid',
	'mc_eid',
	'igshid',
	'yclid',
	'_hsenc',
	'_hsmi',
	'ref_src',
	'twclid',
	'ttclid',
	'li_fat_id',
]);

const isTrackingParam = (name: string) => {
	const key = name.toLowerCase();
	return key.startsWith('utm_') || TRACKING_PARAMS.has(key);
};

export const stripTrackingParams = (url: string): StrippedUrl => {
	const parsed = URL.parse(url);
	if (parsed?.protocol !== 'http:' && parsed?.protocol !== 'https:')
		return { url, removed: [] };

	const removed = [...new Set(parsed.searchParams.keys())].filter(
		isTrackingParam,
	);
	if (removed.length === 0) return { url, removed };
	for (const name of removed) parsed.searchParams.delete(name);
	return { url: parsed.href, removed };
};

export const STRIP_TRACKING_PARAMS_KEY = 'searchmark_stripTrackingParams';

const stripTrackingParamsItem = storage.defineItem<boolean>(
	`local:${STRIP_TRACKING_PARAMS_KEY}`,
	{ fallback: true },
);

export const cleanTabUrl = async (url: string): Promise<StrippedUrl> =>
	(await stripTrackingParamsItem.getValue())
		? stripTrackingParams(url)
		: { url, removed: [] };
