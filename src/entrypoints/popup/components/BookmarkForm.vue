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
import { i18n } from '#i18n';

interface Props {
	modelUrl: string;
	modelTitle: string;
}

interface Emits {
	(e: 'update:modelUrl', value: string): void;
	(e: 'update:modelTitle', value: string): void;
	(e: 'enterPressed'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const url = ref(props.modelUrl);
const title = ref(props.modelTitle);

const updateUrl = () => emit('update:modelUrl', url.value);
const updateTitle = () => emit('update:modelTitle', title.value);

const handleKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter') {
		emit('enterPressed');
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
</style>
