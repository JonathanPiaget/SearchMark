<template>
  <div class="settings-container">
    <header class="settings-header">
      <div class="logo-section">
        <img src="/icon.svg" alt="SearchMark Logo" class="logo">
        <h1>{{ i18n.t('settings') }}</h1>
      </div>
    </header>

    <main class="settings-content">
      <section class="settings-section">
        <h2>{{ i18n.t('appearance') }}</h2>

        <div class="setting-item">
          <div class="setting-info">
            <label for="theme-select" class="setting-label">{{ i18n.t('theme') }}</label>
            <p class="setting-description">{{ i18n.t('themeDescription') }}</p>
          </div>
          <select
            id="theme-select"
            v-model="selectedTheme"
            class="theme-select"
            @change="handleThemeChange"
          >
            <option value="auto">{{ i18n.t('themeAuto') }}</option>
            <option value="light">{{ i18n.t('themeLight') }}</option>
            <option value="dark">{{ i18n.t('themeDark') }}</option>
          </select>
        </div>
      </section>

      <section class="settings-section">
        <h2>{{ i18n.t('quickActions') }}</h2>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">{{ i18n.t('seeLaterFolder') }}</label>
            <p class="setting-description">{{ i18n.t('seeLaterFolderDescription') }}</p>
          </div>
          <div class="folder-selector-wrapper">
            <button
              class="reset-button"
              @click="handleUseDefaultFolder"
              v-if="selectedFolderId"
            >{{ i18n.t('seeLaterResetToDefault') }}</button>
            <FolderSelector
              v-model="selectedFolderId"
              :autofocus="false"
              :auto-select-default="false"
              @folder-selected="handleSeeLaterFolderChange"
            />
          </div>
        </div>
      </section>

      <section class="settings-section support-section">
        <h2>{{ i18n.t('support') }}</h2>

        <div class="setting-item support-item">
          <p class="support-message">{{ i18n.t('supportMessage') }}</p>
          <div class="support-actions">
            <a
              href="https://buymeacoffee.com/piagetjonathan"
              target="_blank"
              rel="noopener noreferrer"
              class="support-button coffee-button"
            >
              {{ i18n.t('buyMeACoffee') }}
            </a>
            <a
              :href="storeUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="support-button rate-button"
            >
              {{ i18n.t('rateExtension') }}
            </a>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { i18n } from '#i18n';
import { useSeeLater } from '../../composables/useSeeLater';
import type { Theme } from '../../composables/useTheme';
import { useTheme } from '../../composables/useTheme';
import FolderSelector from '../popup/components/FolderSelector.vue';

const STORE_URLS = {
	firefox: 'https://addons.mozilla.org/en-US/firefox/addon/searchmark/',
	chrome:
		'https://chromewebstore.google.com/detail/searchmark/ojcnjoecdiojbelkehfhibhljjaocfaf',
};

const { currentTheme, setTheme, initTheme } = useTheme();
const {
	seeLaterFolderId,
	saveSeeLaterFolder,
	clearSeeLaterFolder,
	initSeeLater,
} = useSeeLater();
const selectedTheme = ref<Theme>('auto');
const version = ref('');
const selectedFolderId = ref(seeLaterFolderId.value || '');

const isFirefox = computed(() => navigator.userAgent.includes('Firefox'));
const storeUrl = computed(() =>
	isFirefox.value ? STORE_URLS.firefox : STORE_URLS.chrome,
);

const handleThemeChange = async () => {
	await setTheme(selectedTheme.value);
};

const handleSeeLaterFolderChange = async (folder: {
	id: string;
	name: string;
}) => {
	await saveSeeLaterFolder(folder.id);
};

onMounted(async () => {
	await initTheme();
	await initSeeLater();
	selectedTheme.value = currentTheme.value;

	// Get version from manifest
	const manifest = browser.runtime.getManifest();
	version.value = manifest.version;
});

const handleUseDefaultFolder = async () => {
	selectedFolderId.value = '';
	await clearSeeLaterFolder();
};
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.settings-header {
  background: var(--bg-secondary);
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-primary);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.logo {
  width: 32px;
  height: 32px;
}

.settings-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--accent-primary);
  transition: color 0.2s ease;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
}

.settings-section {
  margin-bottom: 40px;
}

.settings-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-primary);
  transition: color 0.2s ease, border-color 0.2s ease;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  margin-bottom: 16px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
  transition: color 0.2s ease;
}

.setting-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  transition: color 0.2s ease;
}

.theme-select {
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background-color: var(--input-bg);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
}

.theme-select:hover {
  border-color: var(--accent-primary);
}

.theme-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--shadow-primary);
}

.reset-button {
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background-color: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  margin-right: 12px;
  flex-shrink: 0;
}

.reset-button:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.reset-button:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--shadow-primary);
}

.folder-selector-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0;
  width: auto;
  max-width: 500px;
  flex-shrink: 0;
}

.folder-selector-wrapper .folder-selector {
  flex: 1;
  min-width: 300px;
}

.folder-selector-wrapper :deep(.form-group) {
  margin-bottom: 0;
}

.folder-selector-wrapper :deep(.form-group label) {
  display: none;
}

.theme-preview {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.preview-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 12px;
  transition: color 0.2s ease;
}

.preview-box {
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-icon {
  font-size: 16px;
}

.preview-text {
  font-size: 14px;
  color: var(--text-primary);
  transition: color 0.2s ease;
}

.preview-button {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
}

.about-info {
  padding: 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.about-info p {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  transition: color 0.2s ease;
}

.about-info p:last-child {
  margin-bottom: 0;
}

.version {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 12px !important;
  transition: color 0.2s ease;
}

.support-item {
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.support-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  transition: color 0.2s ease;
}

.support-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.support-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.coffee-button {
  background: linear-gradient(135deg, #ffdd00 0%, #fbb034 100%);
  color: #1a1a1a;
  border: none;
}

.coffee-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 176, 52, 0.4);
}

.rate-button {
  background: transparent;
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}

.rate-button:hover {
  background: var(--accent-primary);
  color: white;
}
</style>
