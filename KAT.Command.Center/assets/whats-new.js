/* KAT Command Center - What's New range selection.
 *
 * Pure functions with no DOM access, so the tests can load this file into a bare script context and
 * exercise exactly the code the site runs. docs.js does all the rendering.
 *
 * The What's New route is the app's entry point after an upgrade:
 *
 *   #/whats-new                                      the latest published patch
 *   #/whats-new?version=1.2.15                       that patch alone (first install)
 *   #/whats-new?priorVersion=1.2.13                  every patch newer than 1.2.13
 *   #/whats-new?priorVersion=1.2.13&version=1.2.15   every patch in (1.2.13, 1.2.15]
 *
 * The same parameters are also read from the page's own query string (index.html?priorVersion=...)
 * so either form of URL lands in the same place from file:// and from GitHub Pages. */

(root => {
	'use strict';

	// Three numeric parts. A fourth (FileVersionInfo's revision) is accepted and ignored, because the
	// app reports four parts and only ever ships three.
	function parseVersion(text) {
		const match = /^\s*v?(\d{1,9})\.(\d{1,9})\.(\d{1,9})(?:\.\d{1,9})?\s*$/i.exec(String(text ?? ''));
		return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
	}

	function compareVersions(a, b) {
		for (let i = 0; i < 3; i++) {
			if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
		}
		return 0;
	}

	function formatVersion(parts) {
		return parts.join('.');
	}

	function readParams(hashQuery, search) {
		const params = {};
		for (const source of [search, hashQuery]) {
			if (!source) continue;
			const query = new URLSearchParams(source.replace(/^[?#]/, ''));
			for (const key of ['priorVersion', 'version']) {
				if (query.has(key)) params[key] = query.get(key);
			}
		}
		return params;
	}

	/* releases: every published patch, oldest first, each { version: "x.y.z", minor: "x.y", ... }.
	 * Returns what the What's New view should show:
	 *   mode       'empty' (nothing published) | 'latest' (no priorVersion) | 'since' (priorVersion given)
	 *              | 'current' (priorVersion given but nothing newer is published)
	 *   patches    the releases to show and highlight, oldest first
	 *   crossMinor true when those patches span more than one minor page
	 *   flags      invalidPrior, invalidVersion, versionUnpublished, priorBeforeHistory */
	function selectRange(releases, params) {
		const list = (releases || [])
			.map(release => ({ release, parts: parseVersion(release.version) }))
			.filter(entry => entry.parts)
			.sort((a, b) => compareVersions(a.parts, b.parts));
		const result = {
			mode: 'empty',
			patches: [],
			crossMinor: false,
			prior: null,
			target: null,
			invalidPrior: false,
			invalidVersion: false,
			versionUnpublished: false,
			priorBeforeHistory: false
		};
		if (!list.length) return result;

		const latest = list[list.length - 1];
		let target = latest;

		if (params.version != null && params.version !== '') {
			const wanted = parseVersion(params.version);
			if (!wanted) {
				result.invalidVersion = true;
			} else if (compareVersions(wanted, latest.parts) > 0) {
				// An app newer than the published notes: the documentation push lags the release.
				result.versionUnpublished = true;
			} else {
				// The newest patch at or before the requested one, so an unlisted version still lands.
				let found = null;
				for (const entry of list) {
					if (compareVersions(entry.parts, wanted) <= 0) found = entry;
				}
				target = found || list[0];
			}
		}
		result.target = target.release.version;

		let prior = null;
		if (params.priorVersion != null && params.priorVersion !== '') {
			prior = parseVersion(params.priorVersion);
			if (!prior) result.invalidPrior = true;
		}

		if (!prior) {
			result.mode = 'latest';
			result.patches = [target.release];
			return result;
		}

		result.prior = formatVersion(prior);
		result.priorBeforeHistory = compareVersions(prior, list[0].parts) < 0;
		const patches = list
			.filter(entry => compareVersions(entry.parts, prior) > 0 && compareVersions(entry.parts, target.parts) <= 0)
			.map(entry => entry.release);

		if (!patches.length) {
			result.mode = 'current';
			result.patches = [target.release];
			return result;
		}

		result.mode = 'since';
		result.patches = patches;
		result.crossMinor = new Set(patches.map(release => release.minor)).size > 1;
		return result;
	}

	root.KccWhatsNew = Object.freeze({ parseVersion, compareVersions, formatVersion, readParams, selectRange });
})(typeof window !== 'undefined' ? window : globalThis);
