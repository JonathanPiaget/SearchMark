import { createApp } from 'vue';
import './style.css';
import { loadLocale } from '@/utils/i18n';
import App from './App.vue';

loadLocale().then(() => createApp(App).mount('#app'));
