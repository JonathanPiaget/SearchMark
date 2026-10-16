<template>
  <button
    class="theme-toggle"
    :aria-label="label"
    :title="label"
    @click="cycleTheme"
  >
    <span class="theme-icon">
      <IconMonitor v-if="currentTheme === 'auto'" />
      <IconMoon v-else-if="currentTheme === 'dark'" />
      <IconSun v-else />
    </span>
  </button>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '#i18n';
import { useTheme } from '@/composables/useTheme';
import IconMonitor from '~icons/lucide/monitor';
import IconMoon from '~icons/lucide/moon';
import IconSun from '~icons/lucide/sun';

const { currentTheme, cycleTheme } = useTheme();

const THEME_LABELS = {
	auto: 'themeAuto',
	light: 'themeLight',
	dark: 'themeDark',
} as const;

const label = computed(() =>
	i18n.t('toggleTheme', [i18n.t(THEME_LABELS[currentTheme.value])]),
);
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
  display: inline-block;
}
</style>
