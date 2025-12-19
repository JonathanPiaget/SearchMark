<template>
  <div class="bookmark-list">
    <div v-if="isLoading" class="loading-state">
      <span class="spinner">⏳</span>
      <span class="message">{{ i18n.t('loadingBookmarks') }}</span>
    </div>

    <div v-else-if="bookmarks.length === 0" class="empty-state">
      <span class="icon">📭</span>
      <span class="message">{{ emptyMessage || i18n.t('noBookmarksInFolder') }}</span>
    </div>

    <div v-else class="bookmark-items">
      <BookmarkItem
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        :bookmark="bookmark"
        @open="emit('openBookmark', bookmark)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { i18n } from '#i18n';
import type { BookmarkItem as BookmarkItemType } from '../../../composables/useBookmarkFolder';
import BookmarkItem from './BookmarkItem.vue';

interface Props {
	bookmarks: BookmarkItemType[];
	isLoading?: boolean;
	emptyMessage?: string;
}

defineProps<Props>();

const emit = defineEmits<{
	openBookmark: [bookmark: BookmarkItemType];
}>();
</script>

<style scoped>
.bookmark-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
}

.loading-state .spinner,
.empty-state .icon {
  font-size: 32px;
}

.loading-state .message,
.empty-state .message {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.bookmark-items {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 4px 0;
  min-height: 0;
  flex: 1;
}

.bookmark-items > :not(:last-child) {
  margin-bottom: 8px;
}

/* Custom scrollbar for bookmark list */
.bookmark-items::-webkit-scrollbar {
  width: 8px;
}

.bookmark-items::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.bookmark-items::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.bookmark-items::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}
</style>
