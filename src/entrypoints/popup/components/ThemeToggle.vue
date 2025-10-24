<template>
  <button
    class="theme-toggle"
    :aria-label="i18n.t('toggleTheme')"
    :title="i18n.t('toggleTheme')"
    @click="handleToggle"
  >
    <span class="theme-icon" :class="{ dark: appliedTheme === 'dark' }">
      {{ appliedTheme === 'dark' ? '🌙' : '☀️' }}
    </span>
  </button>
</template>

<script lang="ts" setup>
import { i18n } from '#i18n';
import { useTheme } from '../../../composables/useTheme';

const { appliedTheme, toggleTheme } = useTheme();

const handleToggle = async () => {
	await toggleTheme();
};
</script>

<style scoped>
.theme-toggle {
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

.theme-toggle:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
  display: inline-block;
}

.theme-icon.dark {
  transform: rotate(20deg);
}
</style>
