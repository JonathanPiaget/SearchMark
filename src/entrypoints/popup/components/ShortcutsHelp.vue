<template>
  <button
    class="shortcuts-button"
    :aria-label="i18n.t('shortcutsTitle')"
    :title="i18n.t('shortcutsTitle')"
    @click="open"
  >
    <span class="shortcuts-icon"><IconKeyboard /></span>
  </button>

  <div v-if="isOpen" class="shortcuts-overlay" @click.self="close">
    <div class="shortcuts-panel" role="dialog" :aria-label="i18n.t('shortcutsTitle')">
      <div class="shortcuts-panel-header">
        <span class="shortcuts-panel-title">
          <IconKeyboard class="shortcuts-panel-title-icon" />
          {{ i18n.t('shortcutsTitle') }}
        </span>
        <button
          class="shortcuts-close"
          :aria-label="i18n.t('cancel')"
          @click="close"
        >
          <IconX />
        </button>
      </div>

      <ul class="shortcuts-list">
        <li v-for="(item, index) in shortcuts" :key="index" class="shortcuts-row">
          <span class="shortcuts-label">{{ item.label }}</span>
          <ShortcutKeys :shortcut="item.keys" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { i18n } from '#i18n';
import IconKeyboard from '~icons/lucide/keyboard';
import IconX from '~icons/lucide/x';
import ShortcutKeys from './ShortcutKeys.vue';

const isOpen = ref(false);
const isMac = navigator.userAgent.includes('Mac');
const openShortcut = ref(isMac ? 'Command+Shift+X' : 'Ctrl+Shift+X');
const quickSaveShortcut = isMac ? 'Command+Shift+B' : 'Ctrl+Shift+B';

const shortcuts = computed(() => [
	{ label: i18n.t('openShortcut'), keys: openShortcut.value },
	{ label: i18n.t('shortcutQuickSave'), keys: quickSaveShortcut },
	{ label: i18n.t('shortcutSwitchView'), keys: 'Alt+← / →' },
]);

const handleKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		event.stopPropagation();
		event.preventDefault();
		close();
	}
};

const open = () => {
	isOpen.value = true;
	window.addEventListener('keydown', handleKeydown, true);
};

const close = () => {
	isOpen.value = false;
	window.removeEventListener('keydown', handleKeydown, true);
};

onMounted(async () => {
	const [command] = await browser.commands.getAll();
	if (command?.shortcut) openShortcut.value = command.shortcut;
});

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown, true);
});
</script>

<style scoped>
.shortcuts-button {
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 32px;
}

.shortcuts-button:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  transform: scale(1.05);
}

.shortcuts-button:active {
  transform: scale(0.95);
}

.shortcuts-icon {
  font-size: 16px;
  display: inline-block;
}

.shortcuts-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--shadow-primary);
  backdrop-filter: blur(1px);
}

.shortcuts-panel {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  padding: 16px;
}

.shortcuts-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.shortcuts-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.shortcuts-panel-title-icon {
  color: var(--accent-primary);
}

.shortcuts-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.shortcuts-close:hover {
  background: var(--bg-tertiary);
  color: var(--accent-primary);
}

.shortcuts-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcuts-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 4px;
}

.shortcuts-row + .shortcuts-row {
  border-top: 1px solid var(--border-primary);
}

.shortcuts-label {
  font-size: 14px;
  color: var(--text-primary);
}
</style>
