import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	type BrowserContext,
	test as base,
	chromium,
	type Worker,
} from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = resolve(__dirname, '../.output/chrome-mv3');

interface ExtensionFixtures {
	context: BrowserContext;
	serviceWorker: Worker;
	extensionId: string;
}

export const test = base.extend<ExtensionFixtures>({
	context: async ({ playwright: _playwright }, use) => {
		if (!existsSync(EXTENSION_PATH)) {
			throw new Error(
				`Extension build not found at ${EXTENSION_PATH}. Run \`wxt build\` first (the test:e2e script does this for you).`,
			);
		}

		const context = await chromium.launchPersistentContext('', {
			channel: 'chromium',
			headless: !process.env.HEADED,
			args: [
				`--disable-extensions-except=${EXTENSION_PATH}`,
				`--load-extension=${EXTENSION_PATH}`,
			],
		});

		await use(context);
		await context.close();
	},

	serviceWorker: async ({ context }, use) => {
		let [serviceWorker] = context.serviceWorkers();
		if (!serviceWorker) {
			serviceWorker = await context.waitForEvent('serviceworker');
		}
		await use(serviceWorker);
	},

	extensionId: async ({ serviceWorker }, use) => {
		await use(serviceWorker.url().split('/')[2]);
	},
});

export const expect = test.expect;
