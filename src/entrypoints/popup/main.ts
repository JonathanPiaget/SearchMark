import { createApp } from 'vue';
import './style.css';
import { loadLanguage } from '@/utils/i18n';
import App from './App.vue';

loadLanguage().then(() => createApp(App).mount('#app'));
