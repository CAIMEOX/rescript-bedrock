import { writeFileSync } from "fs";

type SingleFile = {
    name: string,
    path: string,
    sha: string,
    size: number,
    url: string,
    html_url: string,
    git_url: string,
    download_url: string,
    type: string,
    _links: {
        self: string,
        git: string,
        html: string
    }
}

async function fetchJson() {
    const response = await fetch('https://api.github.com/repos/Mojang/bedrock-samples/contents/metadata/script_modules/%40minecraft');
    const data = await response.json() as SingleFile[];
    return data;
}

async function fetchFile(url: string) {
    const response = await fetch(url);
    const data= await response.text();
    return data;
}

async function fetchMeta(files: SingleFile[]) {
    const data = await fetchFile(files.find(file => file.name.startsWith('server_1.8.0-beta'))!.download_url);
    writeFileSync('./meta/server.json', data, 'utf-8');
    // files.map(async (file) => {
    //     const data = await fetchFile(file.download_url);
    //     console.log('fetching ' + file.name);
    // });
}

fetchMeta(await fetchJson());