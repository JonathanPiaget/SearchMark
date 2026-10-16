export interface HighlightedTextPart {
	text: string;
	highlighted: boolean;
}

export function highlightByIndexes(
	text: string,
	indexes?: readonly number[] | null,
): HighlightedTextPart[] {
	if (!indexes?.length) return [{ text, highlighted: false }];

	const result: HighlightedTextPart[] = [];
	const indexSet = new Set(indexes);
	let currentPart = '';
	let currentHighlighted = indexSet.has(0);

	for (let i = 0; i < text.length; i++) {
		const isHighlighted = indexSet.has(i);
		if (isHighlighted === currentHighlighted) {
			currentPart += text[i];
		} else {
			if (currentPart)
				result.push({ text: currentPart, highlighted: currentHighlighted });
			currentPart = text.charAt(i);
			currentHighlighted = isHighlighted;
		}
	}
	if (currentPart)
		result.push({ text: currentPart, highlighted: currentHighlighted });

	return result;
}
