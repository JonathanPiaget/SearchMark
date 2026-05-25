import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
	chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
	binaries: {
		firefox:
			'/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
	},
});
