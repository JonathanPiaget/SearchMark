<template>
  <p class="see-later">
    <button
      type="button"
      class="see-later-button"
      :class="{ loading: isLoading }"
      :title="label"
      :disabled="isLoading"
      @click="handleSeeLater"
    >
      <IconClock class="see-later-icon" />
      <span>{{ i18n.t('seeLaterInstead', { folder: shortFolderTitle }) }}</span>
    </button>
    <template v-if="shortcut">
      <span aria-hidden="true">·</span>
      <kbd class="see-later-key" aria-hidden="true">{{ shortcut }}</kbd>
    </template>
  </p>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { getQuickSaveShortcut } from '@/utils/commands';
import { i18n } from '@/utils/i18n';
import { logError } from '@/utils/logger';
import { notify } from '@/utils/notify';
import { getSeeLaterFolderTitle, quickSave } from '@/utils/seeLater';
import IconClock from '~icons/lucide/clock';

const isLoading = ref(false);
const shortcut = ref<string>();
const folderTitle = ref(i18n.t('seeLater'));
const MAX_FOLDER_CHARS = 24;
const shortFolderTitle = computed(() =>
	folderTitle.value.length > MAX_FOLDER_CHARS
		? `${folderTitle.value.slice(0, MAX_FOLDER_CHARS - 1).trimEnd()}…`
		: folderTitle.value,
);
const label = computed(() => {
	const text = i18n.t('seeLaterInstead', { folder: folderTitle.value });
	return shortcut.value ? `${text} (${shortcut.value})` : text;
});

onMounted(async () => {
	[shortcut.value, folderTitle.value] = await Promise.all([
		getQuickSaveShortcut(),
		getSeeLaterFolderTitle(),
	]);
});

const handleSeeLater = async () => {
	isLoading.value = true;
	try {
		const { folderTitle } = await quickSave();
		notify(i18n.t('seeLaterSuccess', { folderName: folderTitle }));
		window.close();
	} catch (error) {
		logError('Quick save failed', error);
		notify(i18n.t('seeLaterError'));
	} finally {
		isLoading.value = false;
	}
};
</script>

<style scoped>
.see-later {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.see-later-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--accent-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.see-later-button:hover:not(:disabled) {
  color: var(--accent-hover);
}

.see-later-button:active:not(:disabled) {
  opacity: 0.7;
}

.see-later-button:disabled {
  cursor: not-allowed;
}

.see-later-button.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

.see-later-icon {
  width: 13px;
  height: 13px;
}

.see-later-key {
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: var(--text-secondary);
  background: var(--input-bg);
  border: 1px solid var(--border-secondary);
  border-radius: 5px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
