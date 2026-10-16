export interface FoldedText {
	folded: string;
	originalIndexes: (start: number, end: number) => number[];
}

const COMBINING_MARK = /\p{M}/u;

const foldChar = (char: string) =>
	char
		.normalize('NFKD')
		.replace(new RegExp(COMBINING_MARK, 'gu'), '')
		.toLowerCase();

// fuzzysort indexes base letters only, leaving a decomposed accent unhighlighted.
export const withCombiningMarks = (
	text: string,
	indexes: readonly number[],
): number[] => {
	const all = new Set<number>();
	for (const index of indexes) {
		all.add(index);
		for (let next = index + 1; COMBINING_MARK.test(text[next] ?? ''); next++)
			all.add(next);
	}
	return [...all].sort((a, b) => a - b);
};

export const foldAccents = (text: string): FoldedText => {
	let folded = '';
	const sourceStarts: number[] = [];
	let index = 0;
	for (const char of text) {
		const part = foldChar(char);
		folded += part;
		for (let i = 0; i < part.length; i++) sourceStarts.push(index);
		index += char.length;
	}
	sourceStarts.push(text.length);

	const originalIndexes = (start: number, end: number) => {
		const from = sourceStarts[start] ?? text.length;
		let next = end;
		while ((sourceStarts[next] ?? text.length) === sourceStarts[end - 1])
			next++;
		const to = sourceStarts[next] ?? text.length;
		return Array.from({ length: to - from }, (_, i) => from + i);
	};

	return { folded, originalIndexes };
};
