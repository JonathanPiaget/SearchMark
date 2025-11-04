<template>
  <div v-if="!isLoading && locations.length > 0" class="existing-bookmarks">
    <div class="header">
      <span class="icon">📌</span>
      <span class="title">{{ i18n.t('alreadySaved') }}</span>
    </div>
    <div class="locations">
      <div
        v-for="location in locations"
        :key="location.id"
        class="location-item"
        :title="location.folderPath"
      >
        <span class="folder-icon">📁</span>
        <span class="folder-path">{{ location.folderPath }}</span>
        <button
          class="delete-button"
          :disabled="isDeleting"
          :title="i18n.t('delete')"
          @click="showConfirmDialog(location.id)"
        >
          {{ isDeleting ? '⏳' : '🗑️' }}
        </button>
      </div>
    </div>

    <ConfirmDialog
      v-model="confirmDialogVisible"
      :message="i18n.t('confirmDelete')"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { i18n } from '#i18n';
import { useBookmarkActions } from '../../../composables/useBookmarkActions';
import type { BookmarkLocation } from '../../../composables/useBookmarkSearch';
import ConfirmDialog from './ConfirmDialog.vue';

interface Props {
	locations: BookmarkLocation[];
	isLoading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
	bookmarkDeleted: [];
}>();

const { isDeleting, deleteBookmark } = useBookmarkActions();
const confirmDialogVisible = ref(false);
const bookmarkToDelete = ref<string | null>(null);

const showConfirmDialog = (bookmarkId: string) => {
	bookmarkToDelete.value = bookmarkId;
	confirmDialogVisible.value = true;
};

const handleConfirmDelete = async () => {
	if (bookmarkToDelete.value) {
		await deleteBookmark(bookmarkToDelete.value);
		emit('bookmarkDeleted');
		bookmarkToDelete.value = null;
	}
};

const handleCancelDelete = () => {
	bookmarkToDelete.value = null;
};
</script>

<style scoped>
.existing-bookmarks {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  transition: color 0.2s ease;
}

.icon {
  font-size: 14px;
}

.title {
  color: var(--text-primary);
  transition: color 0.2s ease;
}

.locations {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.folder-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.folder-path {
  flex: 1;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.delete-button:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
