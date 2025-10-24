import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-vue', '@wxt-dev/i18n/module'],
	srcDir: 'src',
	manifest: {
		default_locale: 'en',
		permissions: ['bookmarks', 'tabs', 'storage'],
	},
});
