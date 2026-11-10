<template>
  <div class="bookmark-form">
    <div class="form-group">
      <label for="title">{{ i18n.t('title') }}</label>
      <input
        id="title"
        v-model="title"
        type="text"
        class="form-input"
        placeholder="Bookmark title"
        @input="updateTitle"
        @keydown="handleKeydown"
      >
    </div>

    <p v-if="trackingParams.length" class="tracking-note">
      <IconShieldCheck v-if="trackingRemoved" class="tracking-icon removed" />
      <IconShieldOff v-else class="tracking-icon" />
      <span class="tracking-text">
        {{ i18n.t(trackingRemoved ? 'trackingParamsRemoved' : 'trackingParamsKept', trackingParams.length) }}
        <code v-for="name in trackingParams" :key="name" class="tracking-param">{{ name }}</code>
      </span>
      <button type="button" class="tracking-toggle" @click="emit('toggleTracking')">
        {{ i18n.t(trackingRemoved ? 'restore' : 'remove') }}
      </button>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { i18n } from '@/utils/i18n';
import IconShieldCheck from '~icons/lucide/shield-check';
import IconShieldOff from '~icons/lucide/shield-off';

interface Props {
	modelTitle: string;
	trackingParams: string[];
	trackingRemoved: boolean;
}

interface Emits {
	(e: 'update:modelTitle', value: string): void;
	(e: 'submit'): void;
	(e: 'toggleTracking'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const title = ref(props.modelTitle);

const updateTitle = () => emit('update:modelTitle', title.value);

const handleKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter') {
		emit('submit');
	}
};

watch(
	() => props.modelTitle,
	(newValue) => {
		title.value = newValue;
	},
);
</script>

<style scoped>
.bookmark-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.tracking-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.tracking-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}

.tracking-icon.removed {
  color: var(--accent-primary);
}

.tracking-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.tracking-param {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--shadow-primary);
  color: var(--accent-primary);
  font-size: 11px;
}

.tracking-toggle {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--accent-primary);
  text-decoration: underline;
  cursor: pointer;
}
</style>
