import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EXTENSION_PATH = resolve(ROOT, '.output/chrome-mv3');
const OUTPUT_DIR = __dirname; // Screenshots live next to this script.

// Capture at half the target size with deviceScaleFactor 2 => crisp full-size PNG.
const DEVICE_SCALE_FACTOR = 2;
const THEME_STORAGE_KEY = 'searchmark_theme';

const LOCALE = 'en';

export const TARGETS = [
	{ store: 'chrome', viewport: { width: 640, height: 400 } }, // -> 1280x800
	{ store: 'firefox', viewport: { width: 1200, height: 900 } }, // -> 2400x1800
];

// The current tab is simulated; the popup reads url/title from it automatically.
const DEMO_TAB = {
	url: 'https://piagetjonathan.ch',
	title: 'Jonathan Piaget — Resume',
};
// A tab whose URL matches a demo bookmark, so the "already saved" card shows.
const BOOKMARKED_TAB = {
	url: 'https://news.ycombinator.com/',
	title: 'Hacker News',
};

const DEMO_BOOKMARKS = [
	{
		folder: 'Work',
		items: [
			{ title: 'Linear', url: 'https://linear.app' },
			{ title: 'Figma', url: 'https://figma.com' },
			{ title: 'GitHub', url: 'https://github.com' },
		],
	},
	{
		folder: 'Reading',
		items: [
			{ title: 'Hacker News', url: BOOKMARKED_TAB.url },
			{ title: 'The Verge', url: 'https://www.theverge.com' },
			{ title: 'Ars Technica', url: 'https://arstechnica.com' },
		],
	},
	{
		folder: 'Recipes',
		items: [
			{ title: 'Serious Eats', url: 'https://www.seriouseats.com' },
			{ title: 'NYT Cooking', url: 'https://cooking.nytimes.com' },
		],
	},
];

// One screenshot per scene; all light, with a final dark-mode showcase.
export const SCENES = [
	{
		id: '1-save',
		theme: 'light',
		setup: setupSave,
		browserFrame: true,
		caption: 'Save any page in one click',
	},
	{
		id: '2-folders',
		theme: 'light',
		setup: setupFolderSearch,
		keepFocus: true,
		caption: 'Find the right folder instantly',
	},
	{
		id: '3-search',
		theme: 'light',
		setup: setupSearchView,
		caption: 'Search across all your bookmarks',
	},
	{
		id: '4-existing',
		theme: 'light',
		tab: BOOKMARKED_TAB,
		setup: setupSave,
		caption: 'See where a page is already saved',
	},
	{
		id: '5-dark',
		theme: 'dark',
		setup: setupSave,
		caption: 'Light and dark mode',
	},
];

async function setupSave() {
	// Form auto-populates from the simulated tab; nothing to do.
}

async function setupFolderSearch(page) {
	await page.fill('#folder-search', 're');
	await page.waitForSelector('.dropdown-container');
}

async function setupSearchView(page) {
	await page.locator('.view-tabs .tab-button').nth(1).click();
	const searchView = page.locator('.search-view');
	await searchView.locator('#folder-search').fill('Reading');
	await searchView
		.locator('.dropdown-item', { hasText: 'Reading' })
		.first()
		.click();
	await searchView.locator('.bookmark-item').first().waitFor();
}

function loadMessages(lang) {
	const path = resolve(EXTENSION_PATH, '_locales', lang, 'messages.json');
	return JSON.parse(readFileSync(path, 'utf8'));
}

async function injectDemoBookmarks(serviceWorker) {
	await serviceWorker.evaluate(async (bookmarks) => {
		const [tree] = await chrome.bookmarks.getTree();
		const toolbarId = tree.children?.[0]?.id || '1';
		for (const { folder, items } of bookmarks) {
			const created = await chrome.bookmarks.create({
				parentId: toolbarId,
				title: folder,
			});
			for (const { title, url } of items) {
				await chrome.bookmarks.create({ parentId: created.id, title, url });
			}
		}
	}, DEMO_BOOKMARKS);
}

async function setTheme(serviceWorker, theme) {
	await serviceWorker.evaluate(
		({ key, value }) => chrome.storage.local.set({ [key]: value }),
		{ key: THEME_STORAGE_KEY, value: theme },
	);
}

async function layoutFrame(page, frame, caption) {
	await page.evaluate(
		({ width, height, caption }) => {
			const PADDING = Math.round(height * 0.06);
			const styles = getComputedStyle(document.documentElement);
			const bg = styles.getPropertyValue('--bg-primary').trim();
			const textColor = styles.getPropertyValue('--text-primary').trim();

			document.body.style.margin = '0';
			document.body.style.boxSizing = 'border-box';
			document.body.style.width = `${width}px`;
			document.body.style.height = `${height}px`;
			document.body.style.padding = `${PADDING}px`;
			document.body.style.display = 'flex';
			document.body.style.flexDirection = 'column';
			document.body.style.alignItems = 'center';
			document.body.style.overflow = 'hidden';
			document.body.style.background = bg || '#ffffff';

			const captionEl = document.createElement('div');
			captionEl.textContent = caption;
			captionEl.style.flex = '0 0 auto';
			captionEl.style.width = '100%';
			captionEl.style.textAlign = 'center';
			captionEl.style.color = textColor;
			captionEl.style.fontSize = `${Math.round(height * 0.05)}px`;
			captionEl.style.fontWeight = '700';
			captionEl.style.lineHeight = '1.2';
			captionEl.style.marginBottom = `${PADDING}px`;
			document.body.insertBefore(captionEl, document.body.firstChild);

			const app = document.getElementById('app');
			app.style.flex = '1 1 auto';
			app.style.minHeight = '0';
			app.style.width = '100%';
			app.style.display = 'flex';
			app.style.alignItems = 'center';
			app.style.justifyContent = 'center';

			const available = app.getBoundingClientRect();
			const container = document.querySelector('.container');
			const rect = container.getBoundingClientRect();
			container.style.zoom = Math.min(
				available.width / rect.width,
				available.height / rect.height,
			);
		},
		{ width: frame.width, height: frame.height, caption },
	);
}

// Draws a neutral browser chrome around the popup so the store listing shows
// where the extension lives; the caption doubles as the underlying page's headline.
async function layoutBrowserFrame(page, frame, caption, tab) {
	await page.evaluate(
		({ width, height, caption, tab }) => {
			const u = height / 100;
			const px = (n) => `${Math.round(n * u)}px`;
			const el = (tag, style, text) => {
				const node = document.createElement(tag);
				Object.assign(node.style, style);
				if (text) node.textContent = text;
				return node;
			};

			Object.assign(document.body.style, {
				margin: '0',
				width: `${width}px`,
				height: `${height}px`,
				overflow: 'hidden',
				background: '#ffffff',
				fontFamily: 'system-ui, sans-serif',
				color: '#1f1f1f',
				position: 'relative',
			});

			const tabStrip = el('div', {
				height: px(6),
				background: '#dfe1e5',
				display: 'flex',
				alignItems: 'flex-end',
				padding: `0 ${px(2)}`,
			});
			const activeTab = el('div', {
				display: 'flex',
				alignItems: 'center',
				gap: px(1.2),
				height: px(5),
				padding: `0 ${px(2)}`,
				background: '#ffffff',
				borderRadius: `${px(1.5)} ${px(1.5)} 0 0`,
				fontSize: px(1.7),
				maxWidth: '40%',
				whiteSpace: 'nowrap',
				overflow: 'hidden',
			});
			activeTab.append(
				el('span', {
					width: px(1.5),
					height: px(1.5),
					borderRadius: '50%',
					background: '#9f7aea',
					flex: '0 0 auto',
				}),
				el('span', { overflow: 'hidden', textOverflow: 'ellipsis' }, tab.title),
			);
			tabStrip.append(activeTab);

			const toolbar = el('div', {
				height: px(8),
				display: 'flex',
				alignItems: 'center',
				gap: px(1.5),
				padding: `0 ${px(2)}`,
				background: '#ffffff',
				borderBottom: '1px solid #dadce0',
			});
			const dot = () =>
				el('span', {
					width: px(2.5),
					height: px(2.5),
					borderRadius: '50%',
					background: '#e8eaed',
					flex: '0 0 auto',
				});
			const omnibox = el(
				'div',
				{
					flex: '1 1 auto',
					height: px(4.5),
					lineHeight: px(4.5),
					padding: `0 ${px(2)}`,
					borderRadius: px(2.5),
					background: '#f1f3f4',
					fontSize: px(1.7),
					color: '#3c4043',
				},
				tab.url,
			);
			const actionIcon = el('div', {
				width: px(4.5),
				height: px(4.5),
				borderRadius: px(1),
				background: '#e8eaed',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flex: '0 0 auto',
			});
			const icon = el('img', { width: px(2.8), height: px(2.8) });
			icon.src = '/icon/32.png';
			actionIcon.append(icon);
			toolbar.append(dot(), dot(), dot(), omnibox, actionIcon, dot());

			const pageArea = el('div', {
				position: 'absolute',
				inset: `${px(14)} 0 0 0`,
				padding: px(5),
				boxSizing: 'border-box',
			});
			pageArea.append(
				el(
					'h1',
					{
						margin: `0 0 ${px(2.5)}`,
						width: '42%',
						fontSize: px(6),
						lineHeight: '1.15',
						fontWeight: '800',
					},
					caption,
				),
			);
			for (const w of ['34%', '30%', '36%', '22%']) {
				pageArea.append(
					el('div', {
						width: w,
						height: px(1.2),
						marginBottom: px(1.2),
						borderRadius: px(0.6),
						background: '#e8eaed',
					}),
				);
			}

			const container = document.querySelector('.container');
			const app = document.getElementById('app');
			Object.assign(app.style, {
				position: 'absolute',
				top: px(15),
				right: px(2 + 2.5 + 1.5),
				zIndex: '1',
				borderRadius: px(1.5),
				boxShadow:
					'0 8px 32px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)',
				overflow: 'hidden',
			});
			document.body.append(tabStrip, toolbar, pageArea);

			const rect = container.getBoundingClientRect();
			container.style.zoom = Math.min(
				(83 * u) / rect.height,
				(0.5 * width) / rect.width,
			);
		},
		{ width: frame.width, height: frame.height, caption, tab },
	);
}

async function capturePopup(context, extensionId, target, scene, messages) {
	const page = await context.newPage();
	await page.setViewportSize(target.viewport);
	await page.addInitScript(
		({ tab, msgs, locale }) => {
			const fakeTabs = [{ id: 1, active: true, ...tab }];
			Object.defineProperty(chrome.tabs, 'query', {
				configurable: true,
				value: () => Promise.resolve(fakeTabs),
			});
			Object.defineProperty(chrome.i18n, 'getMessage', {
				configurable: true,
				value: (key, substitutions) => {
					const message = msgs[key]?.message ?? '';
					if (!substitutions) return message;
					const subs = Array.isArray(substitutions)
						? substitutions
						: [substitutions];
					return subs.reduce(
						(text, sub, index) => text.replaceAll(`$${index + 1}`, String(sub)),
						message,
					);
				},
			});
			Object.defineProperty(chrome.i18n, 'getUILanguage', {
				configurable: true,
				value: () => locale,
			});
		},
		{ tab: scene.tab ?? DEMO_TAB, msgs: messages, locale: LOCALE },
	);

	await page.goto(`chrome-extension://${extensionId}/popup.html`);
	await page.waitForSelector('.container');
	await scene.setup(page);

	if (!scene.keepFocus) {
		// Blurring restores the selected folder name in the input.
		await page.evaluate(() => document.activeElement?.blur());
	}
	await page.mouse.move(0, 0); // Avoid hover artifacts on items the cursor landed on.
	await page.waitForTimeout(350);
	if (scene.browserFrame) {
		await layoutBrowserFrame(
			page,
			target.viewport,
			scene.caption ?? '',
			scene.tab ?? DEMO_TAB,
		);
	} else {
		await layoutFrame(page, target.viewport, scene.caption ?? '');
	}
	await page.waitForTimeout(150);

	const outputPath = resolve(OUTPUT_DIR, target.store, `${scene.id}.png`);
	mkdirSync(dirname(outputPath), { recursive: true });
	await page.screenshot({ path: outputPath });
	await page.close();
	console.log(`Saved ${outputPath}`);
}

export async function generate({ targets = TARGETS, scenes = SCENES } = {}) {
	const messages = loadMessages(LOCALE);

	const context = await chromium.launchPersistentContext('', {
		headless: false,
		channel: 'chromium',
		deviceScaleFactor: DEVICE_SCALE_FACTOR,
		args: [
			`--disable-extensions-except=${EXTENSION_PATH}`,
			`--load-extension=${EXTENSION_PATH}`,
		],
	});

	let [serviceWorker] = context.serviceWorkers();
	if (!serviceWorker) {
		serviceWorker = await context.waitForEvent('serviceworker');
	}
	const extensionId = serviceWorker.url().split('/')[2];

	await injectDemoBookmarks(serviceWorker);

	for (const target of targets) {
		for (const scene of scenes) {
			await setTheme(serviceWorker, scene.theme);
			await capturePopup(context, extensionId, target, scene, messages);
		}
	}

	await context.close();
}
