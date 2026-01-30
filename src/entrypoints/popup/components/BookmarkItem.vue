<template>
  <div
    class="bookmark-item"
    tabindex="0"
    :title="`${bookmark.title} - ${bookmark.url}`"
    @click="handleOpen"
    @keydown="handleKeydown"
  >
    <div class="bookmark-info">
      <div class="bookmark-header">
        <span class="bookmark-icon">📖</span>
        <span class="bookmark-title">
          <template v-if="filterQuery && (highlightIndexes || !isFuzzy)">
            <template v-for="(part, idx) in highlightedTitle" :key="idx">
              <span v-if="part.highlighted" class="highlight">{{ part.text }}</span>
              <span v-else>{{ part.text }}</span>
            </template>
          </template>
          <template v-else>{{ bookmark.title }}</template>
        </span>
      </div>
      <div class="bookmark-url">{{ bookmark.url }}</div>
      <div v-if="bookmark.parentPath" class="bookmark-path">
        {{ i18n.t('pathLabel') }} {{ bookmark.parentPath }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '#i18n';
import type { BookmarkItem as BookmarkItemType } from '../../../composables/useBookmarkFolder';

interface HighlightedPart {
	text: string;
	highlighted: boolean;
}

interface Props {
	bookmark: BookmarkItemType;
	filterQuery?: string;
	highlightIndexes?: readonly number[] | null;
	isFuzzy?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	open: [];
}>();

const highlightedTitle = computed((): HighlightedPart[] => {
	const text = props.bookmark.title;
	const query = props.filterQuery || '';
	const indexes = props.highlightIndexes;

	if (indexes?.length) {
		const result: HighlightedPart[] = [];
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

	if (!query.trim()) return [{ text, highlighted: false }];

	const result: HighlightedPart[] = [];
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
});

const handleOpen = () => {
	new URL(props.bookmark.url);
	emit('open');
};

const handleKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter') {
		handleOpen();
		return;
	}

	if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
		const currentItem = event.target as HTMLElement;
		const allItems = Array.from(
			currentItem.parentElement?.querySelectorAll('.bookmark-item') || [],
		);
		const currentIndex = allItems.indexOf(currentItem);

		if (event.key === 'ArrowDown' && currentIndex < allItems.length - 1) {
			(allItems[currentIndex + 1] as HTMLElement).focus();
			event.preventDefault();
		} else if (event.key === 'ArrowUp' && currentIndex > 0) {
			(allItems[currentIndex - 1] as HTMLElement).focus();
			event.preventDefault();
		}
	}
};
</script>

<style scoped>
.bookmark-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bookmark-item:hover,
.bookmark-item:focus {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  outline: none;
}

.bookmark-info {
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.bookmark-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.bookmark-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.bookmark-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.bookmark-title .highlight {
  background-color: var(--highlight-bg);
  color: var(--highlight-text);
  border-radius: 2px;
  padding: 0 1px;
}

.bookmark-url {
  font-size: 11px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
  transition: color 0.2s ease;
}

.bookmark-path {
  font-size: 10px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}
</style>
