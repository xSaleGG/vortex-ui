import { readdir, readFile } from 'fs/promises';
import { dev } from '$app/environment';
import { json, error } from '@sveltejs/kit';
import yaml from 'js-yaml';
import path from 'path';
import type { RequestHandler } from './$types';

interface ThemeData {
	title: string;
	name?: string;
	author: string;
	attribution: string;
	theme: object;
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	try {
		const dir = dev ? './static/themes' : './build/client/themes';
		const files = await readdir(dir);
		const themeFiles = files
			.filter((file) => file.endsWith('.yaml'))
			.map((file) => ({ file, path: `${dir}/${file}`, custom: false }));

		let customFiles: string[] = [];
		try {
			customFiles = (await readdir('./data/themes')).filter((file) =>
				/^custom-[a-z0-9-]+\.yaml$/.test(file)
			);
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
		}

		themeFiles.push(
			...customFiles.map((file) => ({
				file,
				path: `./data/themes/${file}`,
				custom: true
			}))
		);

		const themes = await Promise.all(
			themeFiles.map(async ({ file, path: filePath, custom }) => {
				const data = await readFile(filePath, 'utf-8');
				const themeData = yaml.load(data) as ThemeData;

				if (path.parse(file).name !== themeData?.title) {
					return null;
				}

				return {
					file: file,
					title: themeData?.title,
					name: themeData?.name ?? themeData?.title,
					author: themeData?.author,
					attribution: themeData?.attribution,
					theme: themeData?.theme,
					custom
				};
			})
		);

		const validate = themes.filter(Boolean);

		setHeaders({ 'Cache-Control': 'max-age=0' });

		return json(validate);
	} catch (err: any) {
		error(500, err.message);
	}
};
