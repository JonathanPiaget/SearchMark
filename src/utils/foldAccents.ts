export interface FoldedText {
	folded: string;
	originalIndexes: (start: number, end: number) => number[];
}

// NFKD + combining-mark strip mirrors fuzzysort, so both matching modes fold alike.
const foldChar = (char: string) =>
	char.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
