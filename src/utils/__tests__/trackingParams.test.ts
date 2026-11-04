import { describe, expect, it } from 'vitest';
import { stripTrackingParams } from '@/utils/trackingParams';

describe('stripTrackingParams', () => {
	it('removes utm_* and listed trackers, keeps other params, reports names in order', () => {
		expect(
			stripTrackingParams(
				'https://example.com/a?id=1&utm_source=x&fbclid=y&page=2&utm_medium=z',
			),
		).toEqual({
			url: 'https://example.com/a?id=1&page=2',
			removed: ['utm_source', 'fbclid', 'utm_medium'],
		});
	});

	it('drops the ? when only trackers were present and keeps the fragment', () => {
		expect(
			stripTrackingParams('https://example.com/a?utm_source=x&gclid=y#top'),
		).toEqual({
			url: 'https://example.com/a#top',
			removed: ['utm_source', 'gclid'],
		});
	});

	it('matches tracker names case-insensitively', () => {
		expect(
			stripTrackingParams('https://example.com/?UTM_Source=x&FBCLID=y&id=1'),
		).toEqual({
			url: 'https://example.com/?id=1',
			removed: ['UTM_Source', 'FBCLID'],
		});
	});

	it('reports every occurrence of a repeated tracker', () => {
		expect(
			stripTrackingParams(
				'https://example.com/?utm_source=a&id=1&utm_source=b',
			),
		).toEqual({
			url: 'https://example.com/?id=1',
			removed: ['utm_source', 'utm_source'],
		});
	});

	it('returns a URL without trackers byte-identical', () => {
		const url = 'https://example.com?q=a%20b&tag=x+y';
		expect(stripTrackingParams(url)).toEqual({ url, removed: [] });
	});

	it.each([
		'chrome://extensions?utm_source=x',
		'file:///home/me/page.html?utm_source=x',
		'not a url ?utm_source=x',
	])('leaves %s untouched', (url) => {
		expect(stripTrackingParams(url)).toEqual({ url, removed: [] });
	});
});
