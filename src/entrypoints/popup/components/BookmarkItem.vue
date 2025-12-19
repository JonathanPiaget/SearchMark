<template>
  <div
    class="bookmark-item"
    tabindex="0"
    :title="`${bookmark.title} - ${bookmark.url}`"
    @click="handleOpen"
    @keydown.enter="handleOpen"
  >
    <div class="bookmark-info">
      <div class="bookmark-header">
        <span class="bookmark-icon">📖</span>
        <span class="bookmark-title">{{ bookmark.title }}</span>
      </div>
      <div class="bookmark-url">{{ bookmark.url }}</div>
      <div v-if="bookmark.parentPath" class="bookmark-path">
        {{ i18n.t('pathLabel') }} {{ bookmark.parentPath }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { i18n } from '#i18n';
import type { BookmarkItem as BookmarkItemType } from '../../../composables/useBookmarkFolder';

interface Props {
	bookmark: BookmarkItemType;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	open: [];
}>();

const handleOpen = () => {
	new URL(props.bookmark.url);
	emit('open');
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
