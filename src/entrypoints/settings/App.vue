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

        <div class="theme-preview">
          <div class="preview-label">{{ i18n.t('preview') }}:</div>
          <div class="preview-box">
            <div class="preview-header">
              <span class="preview-icon">📁</span>
              <span class="preview-text">{{ i18n.t('previewText') }}</span>
            </div>
            <div class="preview-button">{{ i18n.t('saveBookmark') }}</div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2>{{ i18n.t('about') }}</h2>
        <div class="about-info">
          <p><strong>SearchMark</strong></p>
          <p class="version">{{ i18n.t('version') }}: {{ version }}</p>
          <p class="description">{{ i18n.t('extensionDescription') }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { i18n } from '#i18n';
import type { Theme } from '../../composables/useTheme';
import { useTheme } from '../../composables/useTheme';

const { currentTheme, setTheme, initTheme } = useTheme();
const selectedTheme = ref<Theme>('auto');
const version = ref('');

const handleThemeChange = async () => {
	await setTheme(selectedTheme.value);
};

onMounted(async () => {
	await initTheme();
	selectedTheme.value = currentTheme.value;

	// Get version from manifest
	const manifest = browser.runtime.getManifest();
	version.value = manifest.version;
});
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
</style>
