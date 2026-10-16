import fuzzysort from 'fuzzysort';
import { foldAccents } from '@/utils/foldAccents';

export const FUZZY_THRESHOLD = 0.3;

export interface TitleMatch<T> {
	item: T;
	indexes: readonly number[] | null;
}

export const matchByTitle = <T extends { title: string }>(
	items: T[],
	rawQuery: string,
	fuzzy: boolean,
	limit: number,
): TitleMatch<T>[] => {
	// fuzzysort folds decomposed titles but not a decomposed query.
	const query = rawQuery.normalize('NFC');
	if (!query.trim()) return [];

	if (fuzzy) {
		return fuzzysort
			.go(query, items, { key: 'title', threshold: FUZZY_THRESHOLD, limit })
			.map((r) => ({ item: r.obj, indexes: r.indexes }));
	}

	const foldedQuery = foldAccents(query).folded;
	const matches: TitleMatch<T>[] = [];
	for (const item of items) {
		if (matches.length >= limit) break;
		const title = foldAccents(item.title);
		const start = title.folded.indexOf(foldedQuery);
		if (start === -1) continue;
		matches.push({
			item,
			indexes: title.originalIndexes(start, start + foldedQuery.length),
		});
	}
	return matches;
};
