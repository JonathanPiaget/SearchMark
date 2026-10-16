import { fileURLToPath } from 'node:url';
import { parseMessagesFile } from '@wxt-dev/i18n/build';
import { describe, expect, it } from 'vitest';

const localesDir = fileURLToPath(new URL('..', import.meta.url));

async function readLocale(name: string): Promise<Map<string, string[]>> {
	const messages = await parseMessagesFile(`${localesDir}/${name}`);
	return new Map(
		messages.map((m) => [
			m.key.join('.'),
			m.type === 'plural' ? Object.values(m.plurals) : [m.message],
		]),
	);
}

const en = await readLocale('en.yml');
const fr = await readLocale('fr.yml');

const emptyKeys = (locale: Map<string, string[]>) =>
	[...locale]
		.filter(([, values]) => values.some((value) => value.trim() === ''))
		.map(([key]) => key);

describe('locale parity', () => {
	it('en.yml and fr.yml expose the same keys', () => {
		expect([...fr.keys()].sort()).toEqual([...en.keys()].sort());
	});

	it('has no empty values in en.yml', () => {
		expect(emptyKeys(en)).toEqual([]);
	});

	it('has no empty values in fr.yml', () => {
		expect(emptyKeys(fr)).toEqual([]);
	});
});
