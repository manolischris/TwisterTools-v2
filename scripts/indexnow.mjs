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

    const baseUrl = 'https://www.twistertools.com';

    // 1. Get URLs for all active tools
    const toolUrls = registryData.map(tool => `${baseUrl}${tool.href}`);

    // 2. Get URLs for all 9 category hubs
    const categoryHubs = Object.keys(urlMapData.modern_categories).map(cat => `${baseUrl}/tools/${cat}`);

    // Merge and deduplicate URLs
    const allUrls = [...new Set([...categoryHubs, ...toolUrls])];

    console.log(`Constructed ${allUrls.length} canonical URLs for submission.`);

    const key = 'e350399634564b1ea851e7cf691957d3';
    const payload = {
      host: 'www.twistertools.com',
      key: key,
      keyLocation: `${baseUrl}/${key}.txt`,
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
    
    if (response.ok) {
      console.log('IndexNow submission successful.');
    } else {
      const errorText = await response.text();
      console.error(`IndexNow submission failed. Response: ${errorText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('An error occurred running the IndexNow script:', error);
    process.exit(1);
  }
}

main();
