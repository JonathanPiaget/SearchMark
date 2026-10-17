import { type Component, createApp } from 'vue';
import { applyCachedTheme } from '@/composables/useTheme';
import { loadLanguage } from '@/utils/i18n';

export const mountApp = async (App: Component) => {
	applyCachedTheme();
	await loadLanguage();
	createApp(App).mount('#app');
};
