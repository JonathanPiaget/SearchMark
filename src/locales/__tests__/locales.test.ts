import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const localesDir = fileURLToPath(new URL('..', import.meta.url));

function readLocale(name: string): Map<string, string> {
	const raw = readFileSync(`${localesDir}/${name}`, 'utf8');
	const entries = new Map<string, string>();

	for (const line of raw.split('\n')) {
		if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

		const separator = line.indexOf(':');
		if (separator === -1) {
			throw new Error(`Malformed locale line in ${name}: ${line}`);
		}

		const key = line.slice(0, separator).trim();
		const value = line
			.slice(separator + 1)
			.trim()
			.replace(/^['"]|['"]$/g, '');
		entries.set(key, value);
	}

	return entries;
}

const en = readLocale('en.yml');
const fr = readLocale('fr.yml');

describe('locale parity', () => {
	it('en.yml and fr.yml expose the same keys', () => {
		expect([...fr.keys()].sort()).toEqual([...en.keys()].sort());
	});

	it('has no empty values in en.yml', () => {
		const empty = [...en].filter(([, value]) => value === '').map(([k]) => k);
		expect(empty).toEqual([]);
	});

	it('has no empty values in fr.yml', () => {
		const empty = [...fr].filter(([, value]) => value === '').map(([k]) => k);
		expect(empty).toEqual([]);
	});
});
