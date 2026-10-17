import { createApp } from 'vue';
import { loadLocale } from '@/utils/i18n';
import App from './App.vue';
import './style.css';

loadLocale().then(() => createApp(App).mount('#app'));
