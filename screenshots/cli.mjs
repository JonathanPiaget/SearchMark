import { parseArgs } from 'node:util';
import { generate, LANGUAGES, SCENES, TARGETS } from './generate.mjs';

const HELP = `Usage: node screenshots/cli.mjs [options]

Generate store screenshots. With no options, generates all of them.

Options:
  --store <chrome|firefox>  Limit to store(s). Repeatable or comma-separated.
  --lang  <en|fr>           Limit to language(s).
  --scene <id>              Limit to scene(s) by id or number (e.g. 2 or 2-folders).
  --list                    List available stores, languages and scenes.
  --help                    Show this help.

Examples:
  node screenshots/cli.mjs --store firefox
  node screenshots/cli.mjs --lang fr --scene 2,3
  pnpm screenshots --store chrome --scene 1   # rebuilds the extension first`;

const splitValues = (values) =>
	values
		?.flatMap((value) => value.split(','))
		.map((part) => part.trim())
		.filter(Boolean);

const fail = (label, valid) => {
	console.error(`No matching ${label}. Valid: ${valid.join(', ')}`);
	process.exit(1);
};

function selectFromArgs() {
	const { values } = parseArgs({
		options: {
			store: { type: 'string', multiple: true },
			lang: { type: 'string', multiple: true },
			scene: { type: 'string', multiple: true },
			list: { type: 'boolean' },
			help: { type: 'boolean' },
		},
	});

	if (values.help) {
		console.log(HELP);
		return null;
	}
	if (values.list) {
		const stores = TARGETS.map((t) => `${t.store} (${t.languages.join(', ')})`);
		console.log(`Stores:    ${stores.join(', ')}`);
		console.log(`Languages: ${LANGUAGES.join(', ')}`);
		console.log(`Scenes:    ${SCENES.map((s) => s.id).join(', ')}`);
		return null;
	}

	const stores = splitValues(values.store);
	const langs = splitValues(values.lang);
	const sceneIds = splitValues(values.scene);

	const targets = stores
		? TARGETS.filter((t) => stores.includes(t.store))
		: TARGETS;
	const languages = langs
		? LANGUAGES.filter((l) => langs.includes(l))
		: LANGUAGES;
	const scenes = sceneIds
		? SCENES.filter((s) =>
				sceneIds.some((id) => s.id === id || s.id.startsWith(`${id}-`)),
			)
		: SCENES;

	if (!targets.length)
		fail(
			'store',
			TARGETS.map((t) => t.store),
		);
	if (!languages.length) fail('language', LANGUAGES);
	if (!scenes.length)
		fail(
			'scene',
			SCENES.map((s) => s.id),
		);

	return { targets, languages, scenes };
}

const selection = selectFromArgs();
if (selection) {
	generate(selection).catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
