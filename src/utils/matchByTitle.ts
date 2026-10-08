import fuzzysort from 'fuzzysort';

export const FUZZY_THRESHOLD = 0.3;

export interface TitleMatch<T> {
	item: T;
	indexes: readonly number[] | null;
}

export const matchByTitle = <T extends { title: string }>(
	items: T[],
	query: string,
	fuzzy: boolean,
	limit: number,
): TitleMatch<T>[] => {
	if (!query.trim()) return [];

	if (fuzzy) {
		return fuzzysort
			.go(query, items, { key: 'title', threshold: FUZZY_THRESHOLD, limit })
			.map((r) => ({ item: r.obj, indexes: r.indexes }));
	}

	const lowerQuery = query.toLowerCase();
	return items
		.filter((item) => item.title.toLowerCase().includes(lowerQuery))
		.slice(0, limit)
		.map((item) => ({ item, indexes: null }));
};
