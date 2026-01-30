export interface HighlightedTextPart {
	text: string;
	highlighted: boolean;
}

export function highlightByIndexes(
	text: string,
	indexes: readonly number[],
): HighlightedTextPart[] {
	if (indexes.length === 0) return [{ text, highlighted: false }];

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
			currentPart = text[i];
			currentHighlighted = isHighlighted;
		}
	}
	if (currentPart)
		result.push({ text: currentPart, highlighted: currentHighlighted });

	return result;
}

export function highlightBySubstring(
	text: string,
	query: string,
): HighlightedTextPart[] {
	if (!query.trim()) return [{ text, highlighted: false }];

	const result: HighlightedTextPart[] = [];
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	let lastIndex = 0;
	let index = lowerText.indexOf(lowerQuery);

	while (index !== -1) {
		if (index > lastIndex) {
			result.push({
				text: text.substring(lastIndex, index),
				highlighted: false,
			});
		}
		result.push({
			text: text.substring(index, index + query.length),
			highlighted: true,
		});
		lastIndex = index + query.length;
		index = lowerText.indexOf(lowerQuery, lastIndex);
	}

	if (lastIndex < text.length) {
		result.push({ text: text.substring(lastIndex), highlighted: false });
	}

	return result;
}

export function highlightText(
	text: string,
	query: string,
	indexes?: readonly number[] | null,
): HighlightedTextPart[] {
	return indexes?.length
		? highlightByIndexes(text, indexes)
		: highlightBySubstring(text, query);
}
