import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const version = process.env.RELEASE_TAG;
const releaseNotes = process.env.RELEASE_BODY?.trim();
const addonPath = process.env.ADDON_REPO_PATH ?? 'addon-vortex-ui';
const packageData = JSON.parse(await readFile('package.json', 'utf8'));

if (!/^\d{4}\.\d+\.\d+$/.test(version ?? '')) {
	throw new Error(
		`Invalid release tag: ${version ?? '(missing)'}. Expected YYYY.M.PATCH without a v prefix.`
	);
}

if (!releaseNotes) {
	throw new Error(`Release ${version} has no release notes.`);
}

if (packageData.version !== version) {
	throw new Error(
		`Release tag ${version} does not match package.json version ${packageData.version}.`
	);
}

const configPath = join(addonPath, 'config.yaml');
const changelogPath = join(addonPath, 'CHANGELOG.md');
const config = await readFile(configPath, 'utf8');
const changelog = await readFile(changelogPath, 'utf8');
const versionLines = config.match(/^version:.*$/gm) ?? [];

if (versionLines.length !== 1) {
	throw new Error(`Expected exactly one top-level version in ${configPath}.`);
}

await writeFile(configPath, config.replace(/^version:.*$/m, `version: ${version}`));

const titleMatch = changelog.match(/^# [^\r\n]*(?:\r?\n|$)/);
const title = titleMatch?.[0].trimEnd();
const previousEntries = (titleMatch ? changelog.slice(titleMatch[0].length) : changelog).trim();
const releaseEntry = `## ${version}\n\n${releaseNotes}`;

if (!previousEntries.startsWith(`## ${version}\n`)) {
	const entries = [title, releaseEntry, previousEntries].filter(Boolean).join('\n\n');
	await writeFile(changelogPath, `${entries}\n`);
}

console.log(`Updated add-on metadata to ${version}.`);
