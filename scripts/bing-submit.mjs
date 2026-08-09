import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🔑 PASTE YOUR BING WEBMASTER API KEY HERE:
const BING_API_KEY = '34f15edb37114e378617625d3f6e4366';

// ⚙️ How many of the latest tools to submit if no specific path is given:
const RECENT_TOOLS_COUNT = 10;

async function main() {
    try {
        const baseUrl = 'https://www.twistertools.com';
        const cliArgs = process.argv.slice(2);
        let targetUrls = [];

        if (cliArgs.length > 0) {
            // MODE 1: Submit specific path(s) passed in the command
            console.log(`Targeting ${cliArgs.length} specific path(s) passed via command line...`);
            targetUrls = cliArgs.map(arg => {
                const cleanPath = arg.startsWith('/') ? arg : `/${arg}`;
                return `${baseUrl}${cleanPath}`;
            });
        } else {
            // MODE 2: Auto-select the N most recently added tools + date-tools hub
            const registryPath = path.join(__dirname, '../lib/tools-registry.json');
            console.log('Reading tools registry to identify recent tools...');
            const registryData = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

            // Take only the last N tools added to the registry
            const latestTools = registryData.slice(-RECENT_TOOLS_COUNT);
            const toolUrls = latestTools.map(tool => `${baseUrl}${tool.href}`);

            // Include the new category hub
            const categoryHub = `${baseUrl}/tools/date-tools`;

            targetUrls = [...new Set([categoryHub, ...toolUrls])];
            console.log(`Auto-selected latest ${latestTools.length} tools + new category hub.`);
        }

        console.log('\n--- URLs Scheduled for Bing Submission ---');
        targetUrls.forEach(url => console.log(` - ${url}`));
        console.log('-------------------------------------------\n');

        const payload = {
            siteUrl: baseUrl,
            urlList: targetUrls
        };

        console.log('Sending submission request to Bing Webmaster API...');
        const response = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${BING_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        console.log(`HTTP Response Status Code: ${response.status}`);

        if (response.ok || response.status === 200) {
            const data = await response.json();
            console.log(`\n SUCCESS! ${targetUrls.length} new URLs submitted directly to Bing!`, data);
        } else {
            const errorText = await response.text();
            console.error(`❌ Submission response: ${errorText}`);
        }
    } catch (error) {
        console.error('An error occurred during Bing submission:', error);
    }
}

main();