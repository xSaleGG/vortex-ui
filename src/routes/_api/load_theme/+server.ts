import { readFile } from 'fs/promises';
import { error, isHttpError, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import yaml from 'js-yaml';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const theme = body?.theme;

		if (typeof theme !== 'string' || !/^[a-z0-9-]+$/.test(theme)) {
			error(400, 'Invalid theme name');
		}

		const filePath = theme.startsWith('custom-')
			? `./data/themes/${theme}.yaml`
			: `${dev ? 'static' : 'build/client'}/themes/${theme}.yaml`;
		const file = await readFile(filePath, 'utf8');
		const content = yaml.load(file);

		return json(content);
	} catch (err: any) {
		if (isHttpError(err)) throw err;
		error(500, err.message);
	}
};
