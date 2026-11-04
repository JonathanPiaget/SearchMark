<template>
  <div class="bookmark-form">
    <div class="form-group">
      <label for="url">{{ i18n.t('url') }}</label>
      <input
        id="url"
        v-model="url"
        type="url"
        class="form-input"
        placeholder="https://example.com"
        @input="updateUrl"
        @keydown="handleKeydown"
      >
      <p v-if="removedCount" class="url-note">
        {{ i18n.t('trackingParamsRemoved', removedCount) }} ·
        <button type="button" class="url-note-restore" @click="emit('restore')">{{ i18n.t('restore') }}</button>
      </p>
    </div>

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

  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { i18n } from '@/utils/i18n';

interface Props {
	modelUrl: string;
	modelTitle: string;
	removedCount: number;
}

interface Emits {
	(e: 'update:modelUrl', value: string): void;
	(e: 'update:modelTitle', value: string): void;
	(e: 'submit'): void;
	(e: 'restore'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const url = ref(props.modelUrl);
const title = ref(props.modelTitle);

const updateUrl = () => emit('update:modelUrl', url.value);
const updateTitle = () => emit('update:modelTitle', title.value);

const handleKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter') {
		emit('submit');
	}
};

watch(
	() => props.modelUrl,
	(newValue) => {
		url.value = newValue;
	},
);
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

.url-note {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.url-note-restore {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--accent-primary);
  text-decoration: underline;
  cursor: pointer;
}
</style>
