import { createApp } from 'vue';
import { loadLanguage } from '@/utils/i18n';
import App from './App.vue';
import './style.css';

loadLanguage().then(() => createApp(App).mount('#app'));
