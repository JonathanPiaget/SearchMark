import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-vue', '@wxt-dev/i18n/module'],
	srcDir: 'src',
	vite: () => ({
		plugins: [Icons({ compiler: 'vue3' })],
	}),
	manifest: ({ manifestVersion }) => ({
		default_locale: 'en',
		permissions: ['bookmarks', 'tabs', 'storage'],
		options_ui: {
			page: 'settings.html',
			open_in_tab: true,
		},
		browser_specific_settings: {
			gecko: {
				data_collection_permissions: {
					required: ['none'],
				},
			},
		},
		commands: {
			[manifestVersion === 3 ? '_execute_action' : '_execute_browser_action']: {
				suggested_key: { default: 'Ctrl+Shift+X', mac: 'Command+Shift+X' },
				description: 'Open SearchMark',
			},
		},
	}),
});
