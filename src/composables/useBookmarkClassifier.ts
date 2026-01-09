import { type BookmarkFolder, useFolderTree } from './useFolderTree';

export interface ClassificationResult {
	action: 'existing' | 'new';
	folderPath: string;
	newFolderName?: string;
	confidence: 'high' | 'medium' | 'low';
	reasoning: string;
}

export function useBookmarkClassifier() {
	const { allFolders, loadFolders } = useFolderTree();

	function formatFolderTree(folderList: BookmarkFolder[]): string {
		const childrenMap = new Map<string | undefined, BookmarkFolder[]>();

		for (const folder of folderList) {
			const parentId = folder.parentId;
			const existing = childrenMap.get(parentId);
			if (existing) {
				existing.push(folder);
			} else {
				childrenMap.set(parentId, [folder]);
			}
		}

		function buildTree(parentId: string | undefined, indent: number): string {
			const children = childrenMap.get(parentId) || [];
			let result = '';

			for (const folder of children) {
				result += `${'  '.repeat(indent)}${folder.title}/\n`;
				result += buildTree(folder.id, indent + 1);
			}

			return result;
		}

		const rootParentIds = ['0', '1', '2'];
		let tree = '';
		for (const rootId of rootParentIds) {
			tree += buildTree(rootId, 0);
		}

		return tree || buildTree(undefined, 0);
	}

	function generatePrompt(url: string): string {
		const tree = formatFolderTree(allFolders.value);

		return `## Page to Classify URL:
${url}

## Folder Structure
${tree}`;
	}

	function downloadPrompt(url: string): void {
		const prompt = generatePrompt(url);
		const blob = new Blob([prompt], { type: 'text/plain' });
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = blobUrl;
		a.download = `classify-bookmark-${Date.now()}.txt`;
		a.click();
		URL.revokeObjectURL(blobUrl);
	}

	function parseResponse(response: string): ClassificationResult | null {
		const jsonMatch = response.match(/\{[\s\S]*?\}/);
		if (!jsonMatch) return null;

		try {
			return JSON.parse(jsonMatch[0]) as ClassificationResult;
		} catch {
			return null;
		}
	}

	return {
		loadFolders,
		generatePrompt,
		downloadPrompt,
		parseResponse,
	};
}
