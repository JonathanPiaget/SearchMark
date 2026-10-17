<template>
  <div class="save-section">
    <button @click="handleSave" class="save-button" :disabled="isLoading">
      <span>{{ isLoading ? i18n.t('saving') : i18n.t('saveBookmark') }}</span>
      <kbd v-if="!isLoading" class="key" aria-hidden="true">↵</kbd>
    </button>
    <div v-if="message" class="message" :class="{ 'error': message.includes('Error') }">
      {{ message }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { i18n } from '@/utils/i18n';

interface Props {
	message?: string;
	isLoading?: boolean;
}

type Emits = (e: 'save') => void;

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleSave = () => {
	emit('save');
};
</script>

<style scoped>
.save-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  color: white;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-hover-secondary) 100%);
}

.save-button:active:not(:disabled) {
  transform: scale(0.98);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.key {
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 5px;
}

.message {
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.message.error {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
}
</style>
