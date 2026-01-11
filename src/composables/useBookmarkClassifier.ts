import { type BookmarkFolder, useFolderTree } from './useFolderTree';

export interface ClassificationFolder {
	id: string;
	name: string;
	children?: ClassificationFolder[];
}

export interface ClassificationData {
	url: string;
	folders: ClassificationFolder[];
}

export interface ClassificationResult {
	action: 'existing' | 'new';
	folder_id?: string;
	parent_id?: string;
	new_folder_name?: string;
}

function toClassificationFolder(folder: BookmarkFolder): ClassificationFolder {
	const result: ClassificationFolder = {
		id: folder.id,
		name: folder.title,
	};

	if (folder.children && folder.children.length > 0) {
		result.children = folder.children.map(toClassificationFolder);
	}

	return result;
}

export function useBookmarkClassifier() {
	const { allFolders, loadFolders } = useFolderTree();

	function generateData(url: string): ClassificationData {
		const rootFolders = allFolders.value.filter((folder) => folder.path === '');

		return {
			url,
			folders: rootFolders.map(toClassificationFolder),
		};
	}

	function downloadData(url: string): void {
		const data = generateData(url);
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: 'application/json',
		});
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = blobUrl;
		a.download = `classify-bookmark-${Date.now()}.json`;
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
		generateData,
		downloadData,
		parseResponse,
	};
}
