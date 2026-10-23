import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
	chromiumArgs: [
		'--user-data-dir=./.wxt/chrome-data',
		'--remote-debugging-port=9222',
	],
	binaries: {
		firefox:
			'/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
	},
});
