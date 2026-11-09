<template>
  <span class="shortcut-keys">
    <kbd v-for="(key, index) in keys" :key="index" class="shortcut-key">{{ key }}</kbd>
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { shortcutKeys } from '@/utils/commands';

const props = defineProps<{ shortcut: string }>();

const keys = computed(() => shortcutKeys(props.shortcut));
</script>

<style scoped>
.shortcut-keys {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  box-shadow: inset 0 -2px 0 var(--border-primary);
  white-space: nowrap;
}
</style>
