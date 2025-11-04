<template>
  <Teleport to="body">
    <div v-if="modelValue" class="dialog-backdrop" @click="handleCancel">
      <div class="dialog-container" @click.stop>
        <div class="dialog-content">
          <div class="dialog-message">
            {{ message }}
          </div>
          <div class="dialog-actions">
            <button class="dialog-button cancel-button" @click="handleCancel">
              {{ i18n.t('cancel') }}
            </button>
            <button class="dialog-button confirm-button" @click="handleConfirm">
              {{ i18n.t('confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { i18n } from '#i18n';

interface Props {
	modelValue: boolean;
	message: string;
}

interface Emits {
	(e: 'update:modelValue', value: boolean): void;
	(e: 'confirm'): void;
	(e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleConfirm = () => {
	emit('update:modelValue', false);
	emit('confirm');
};

const handleCancel = () => {
	emit('update:modelValue', false);
	emit('cancel');
};

const handleKeydown = (event: KeyboardEvent) => {
	if (!props.modelValue) return;

	if (event.key === 'Escape') {
		event.preventDefault();
		handleCancel();
	} else if (event.key === 'Enter') {
		event.preventDefault();
		handleConfirm();
	}
};

onMounted(() => {
	document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-container {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.2s ease;
  transition: background-color 0.2s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-content {
  padding: 24px;
}

.dialog-message {
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 24px;
  text-align: center;
  transition: color 0.2s ease;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  flex: 1;
}

.cancel-button {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.cancel-button:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-primary);
}

.cancel-button:active {
  transform: scale(0.98);
}

.confirm-button {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
}

.confirm-button:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.confirm-button:active {
  transform: scale(0.98);
}
</style>
