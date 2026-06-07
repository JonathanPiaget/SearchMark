<template>
  <button
    class="settings-button"
    :aria-label="i18n.t('settings')"
    :title="i18n.t('settings')"
    @click="handleClick"
  >
    <span class="settings-icon"><IconSettings /></span>
  </button>
</template>

<script lang="ts" setup>
import { i18n } from '#i18n';
import IconSettings from '~icons/lucide/settings';

const handleClick = () => {
	browser.runtime.openOptionsPage();
};
</script>

<style scoped>
.settings-button {
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

.settings-button:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  transform: scale(1.05);
}

.settings-button:active {
  transform: scale(0.95);
}

.settings-icon {
  font-size: 16px;
  display: inline-block;
}

.settings-button:hover .settings-icon {
  animation: spin-icon 0.6s ease;
}

@keyframes spin-icon {
  to {
    transform: rotate(360deg);
  }
}
</style>
