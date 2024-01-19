import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { Command } from 'commander';
import generate from './core';
type SingleFile = {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	download_url: string;
	type: string;
	_links: {
		self: string;
		git: string;
		html: string;
	};
};

async function fetchJson(branch: string = 'main') {
	const response = await fetch(
		'https://api.github.com/repos/Mojang/bedrock-samples/contents/metadata/script_modules/%40minecraft?ref=' +
			branch
	);
	const data = (await response.json()) as SingleFile[];
	return data;
}

async function fetchFile(url: string) {
	const response = await fetch(url);
	const data = await response.text();
	return data;
}

const program = new Command();
program.name('rescript-bedrock').description('CLI to fetch and process Minecraft metadata').version('0.0.2');

program
	.command('list')
	.description('List all files in script module in a specify branch')
	.argument('<branch>', 'branch name')
	.action(async (branch) => {
		const data = await fetchJson(branch);
		data.sort().map((file: SingleFile, index: number) => {
			console.log(`[${index}]: ${file.name}`);
		});
	});

program
	.command('fetch')
	.description('Fetch a single file in script module in a specify branch')
	.argument('<branch>', 'branch name')
	.argument('<index>', 'file index')
	.option('-o, --output <path>', 'output path')
	.action(async (branch, index, options) => {
		const data = await fetchJson(branch);
		const file = data[parseInt(index)];
		const content = await fetchFile(file.download_url);
		if (options.output) {
			writeFileSync(options.output, content, 'utf-8');
		} else {
			if (!existsSync('meta')) mkdirSync('meta');
			writeFileSync('meta/' + file.name, content, 'utf-8');
		}
	});

program
    .command('generate')
    .description('Generate rescript binding from metadata')
    .argument('<path>', 'path to metadata')
    .argument('<output>', 'output path')
    .action((path, output) => {
        const data = readFileSync(path, 'utf-8');
        const code = generate(data);
        writeFileSync(output, code, 'utf-8');
    });

program.
    command('process', { isDefault: true })
    .description('Fetch metadata and generate rescript binding')
    .argument('<branch>', 'branch name')
    .argument('<index>', 'file index')
    .argument('<output>', 'output path')
    .action(async (branch, index, output) => {
        const data = await fetchJson(branch);
		console.log('List fetched');
        const file = data[parseInt(index)];
        const content = await fetchFile(file.download_url);
		console.log('File fetched');
        const code = generate(content);
		console.log('Code generated');
        writeFileSync(output, code, 'utf-8');
		console.log('Done');
    });

program.parse();
