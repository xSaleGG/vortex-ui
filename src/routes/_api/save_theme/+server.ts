import { access, mkdir, readdir, writeFile } from 'fs/promises';
import { error, isHttpError, json } from '@sveltejs/kit';
import yaml from 'js-yaml';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let body: any;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid theme data');
	}

	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const sourceId = body?.id;
	const sourceTheme = body?.theme;
	if (!name || name.length > 60) error(400, 'Theme name must be between 1 and 60 characters');
	if (!sourceTheme || typeof sourceTheme !== 'object' || Array.isArray(sourceTheme)) {
		error(400, 'Invalid theme tokens');
	}
	if (
		sourceId !== undefined &&
		(typeof sourceId !== 'string' || !/^custom-[a-z0-9-]+$/.test(sourceId))
	) {
		error(400, 'Built-in themes cannot be overwritten');
	}

	const theme: Record<string, string> = {};
	for (const [key, value] of Object.entries(sourceTheme)) {
		if (!/^[a-z0-9-]+$/.test(key) || (typeof value !== 'string' && typeof value !== 'number')) {
			error(400, 'Invalid theme token');
		}
		const tokenValue = String(value).trim();
		if (tokenValue.length > 500 || /[;{}<>]/.test(tokenValue)) {
			error(400, `Invalid value for ${key}`);
		}
		theme[key] = tokenValue;
	}

	let id = sourceId as string | undefined;
	try {
		await mkdir('./data/themes', { recursive: true });

		if (!id) {
			const slug = name
				.normalize('NFKD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
			if (!slug) error(400, 'Theme name must include a letter or number');

			const existing = new Set(await readdir('./data/themes'));
			const baseId = `custom-${slug}`;
			id = baseId;
			let suffix = 2;
			while (existing.has(`${id}.yaml`)) id = `${baseId}-${suffix++}`;
		} else {
			await access(`./data/themes/${id}.yaml`).catch(() => error(404, 'Custom theme not found'));
		}

		const data = yaml.dump({
			title: id,
			name,
			author: 'Custom',
			attribution: '',
			theme
		});
		await writeFile(`./data/themes/${id}.yaml`, data, 'utf8');
		return json({ title: id, name, author: 'Custom', attribution: '', theme, custom: true });
	} catch (err: any) {
		if (isHttpError(err)) throw err;
		error(500, err.message);
	}
};
