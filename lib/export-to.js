import fs from 'fs';
import path from 'path';

/* Import Custom Media from CSS File
/* ========================================================================== */

async function exportCustomMediaToCssFile(to, customMedia) {
	const cssContent = Object.keys(customMedia).reduce((cssLines, name) => {
		cssLines.push(`@custom-media ${name} ${customMedia[name]};`);

		return cssLines;
	}, []).join('\n');
	const css = `${cssContent}\n`;

	await writeFile(to, css);
}

/* Import Custom Media from JSON file
/* ========================================================================== */

async function exportCustomMediaToJsonFile(to, customMedia) {
	const jsonContent = JSON.stringify({
		'custom-media': customMedia
	}, null, '  ');
	const json = `${jsonContent}\n`;

	await writeFile(to, json);
}

/* Import Custom Media from Common JS file
/* ========================================================================== */

async function exportCustomMediaToCjsFile(to, customMedia) {
	const jsContents = Object.keys(customMedia).reduce((jsLines, name) => {
		jsLines.push(`\t\t'${escapeForJS(name)}': '${escapeForJS(customMedia[name])}'`);

		return jsLines;
	}, []).join(',\n');
	const js = `module.exports = {\n\tcustomMedia: {\n${jsContents}\n\t}\n};\n`;

	await writeFile(to, js);
}

/* Import Custom Media from Module JS file
/* ========================================================================== */

async function exportCustomMediaToMjsFile(to, customMedia) {
	const mjsContents = Object.keys(customMedia).reduce((mjsLines, name) => {
		mjsLines.push(`\t'${escapeForJS(name)}': '${escapeForJS(customMedia[name])}'`);

		return mjsLines;
	}, []).join(',\n');
	const mjs = `export const customMedia = {\n${mjsContents}\n};\n`;

	await writeFile(to, mjs);
}

/* Export Custom Media to Destinations
/* ========================================================================== */

export default function exportCustomMediaToDestinations(customMedia, destinations) {
	return Promise.all(destinations.map(async destination => {
		if (destination instanceof Function) {
			await destination(defaultCustomMediaToJSON(customMedia));
		} else {
			// read the destination as an object
			const opts = destination === Object(destination) ? destination : { to: String(destination) };

			// transformer for custom media into a JSON-compatible object
			const toJSON = opts.toJSON || defaultCustomMediaToJSON;

			if ('customMedia' in opts) {
				// write directly to an object as customMedia
				opts.customMedia = toJSON(customMedia);
			} else if ('custom-media' in opts) {
				// write directly to an object as custom-media
				opts['custom-media'] = toJSON(customMedia);
			} else {
				// destination pathname
				const to = String(opts.to || '');

				// type of file being written to
				const type = (opts.type || path.extname(to).slice(1)).toLowerCase();

				// transformed custom media
				const customMediaJSON = toJSON(customMedia);

				if (type === 'css') {
					await exportCustomMediaToCssFile(to, customMediaJSON);
				}

				if (type === 'js') {
					await exportCustomMediaToCjsFile(to, customMediaJSON);
				}

				if (type === 'json') {
					await exportCustomMediaToJsonFile(to, customMediaJSON);
				}

				if (type === 'mjs') {
					await exportCustomMediaToMjsFile(to, customMediaJSON);
				}
			}
		}
	}));
}

/* Helper utilities
/* ========================================================================== */

const defaultCustomMediaToJSON = customMedia => {
	return Object.keys(customMedia).reduce((customMediaJSON, key) => {
		customMediaJSON[key] = String(customMedia[key]);

		return customMediaJSON;
	}, {});
};

const writeFile = (to, text) => new Promise((resolve, reject) => {
	fs.writeFile(to, text, error => {
		if (error) {
			reject(error);
		} else {
			resolve();
		}
	});
});

const escapeForJS = string => string.replace(/\\([\s\S])|(')/g, '\\$1$2').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
