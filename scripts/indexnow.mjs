import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    const registryPath = path.join(__dirname, '../lib/tools-registry.json');
    const urlMapPath = path.join(__dirname, '../url-map.json');

    console.log('Reading tools registry and url map...');
    const registryData = JSON.parse(await fs.readFile(registryPath, 'utf-8'));
    const urlMapData = JSON.parse(await fs.readFile(urlMapPath, 'utf-8'));

    const host = 'www.twistertools.com';
    const baseUrl = `https://${host}`;
    const key = 'e350399634564b1ea851e7cf691957d3';

    // 1. Get URLs for active tools
    const toolUrls = registryData.map(tool => `${baseUrl}${tool.href}`);

    // 2. Get URLs for category hubs
    const categoryHubs = Object.keys(urlMapData.modern_categories).map(cat => `${baseUrl}/tools/${cat}`);

    const allUrls = [...new Set([baseUrl, ...categoryHubs, ...toolUrls])];

    console.log(`Constructed ${allUrls.length} canonical URLs for ${host}.`);

    // Standard IndexNow payload (omitting keyLocation uses default root path)
    const payload = {
      host: host,
      key: key,
      urlList: allUrls
    };

    console.log('Sending POST request to IndexNow API...');
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    console.log(`HTTP Response Status Code: ${response.status}`);

    if (response.ok || response.status === 200 || response.status === 202) {
      console.log('✅ IndexNow submission successful!');
    } else {
      const errorText = await response.text();
      console.error(`IndexNow submission response: ${errorText}`);
    }
  } catch (error) {
    console.error('An error occurred running the IndexNow script:', error);
  }
}

main();