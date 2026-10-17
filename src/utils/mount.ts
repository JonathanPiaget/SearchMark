import { type Component, createApp } from 'vue';
import { loadLanguage } from '@/utils/i18n';

export const mountApp = async (App: Component) => {
	await loadLanguage();
	createApp(App).mount('#app');
};
