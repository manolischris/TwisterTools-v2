import fs from 'fs';
import path from 'path';
import http from 'http';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// Base URL of the development server
const DEV_SERVER = process.env.TEST_SERVER || 'http://localhost:3000';
const SITEMAP_URL = `${DEV_SERVER}/sitemap.xml`;

// Read url-map.json
const urlMapPath = path.resolve(__dirname, '../url-map.json');
if (!fs.existsSync(urlMapPath)) {
  console.error(`${colors.red}[ERROR] Could not find url-map.json at: ${urlMapPath}${colors.reset}`);
  process.exit(1);
}

const urlMap = JSON.parse(fs.readFileSync(urlMapPath, 'utf8'));

// Read tools-registry.json
const toolsRegistryPath = path.resolve(__dirname, '../lib/tools-registry.json');
if (!fs.existsSync(toolsRegistryPath)) {
  console.error(`${colors.red}[ERROR] Could not find tools-registry.json at: ${toolsRegistryPath}${colors.reset}`);
  process.exit(1);
}

const toolsRegistry = JSON.parse(fs.readFileSync(toolsRegistryPath, 'utf8'));

// Helper to perform HTTP GET request (does not follow redirects automatically)
function checkUrl(url: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Normalize Location Header
function getNormalizedPath(location: string | undefined): string {
  if (!location) return '';
  try {
    // If location is absolute, return the pathname
    if (location.startsWith('http://') || location.startsWith('https://')) {
      return new URL(location).pathname;
    }
    return location;
  } catch {
    return location;
  }
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================`);
  console.log(`   TWISTERTOOLS REDIRECT & SITEMAP VALIDATION ENGINE`);
  console.log(`====================================================${colors.reset}\n`);

  console.log(`${colors.gray}Target environment: ${DEV_SERVER}${colors.reset}\n`);

  // Check if dev server is up
  try {
    await checkUrl(DEV_SERVER);
  } catch (err: any) {
    console.error(`${colors.red}${colors.bold}[FATAL ERROR] Cannot connect to local dev server at ${DEV_SERVER}.`);
    console.error(`Please ensure the server is running (e.g. npm run dev).${colors.reset}\n`);
    process.exit(1);
  }

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // 1. Verify Category-Level Redirects
  console.log(`${colors.bold}--- Testing Category-Level Redirects ---${colors.reset}`);
  for (const redirect of urlMap.redirects) {
    totalTests++;
    const sourcePath = redirect.from;
    const expectedDest = redirect.to;
    const sourceUrl = `${DEV_SERVER}${sourcePath}`;

    try {
      const res = await checkUrl(sourceUrl);
      const destPath = getNormalizedPath(res.headers.location);
      const isRedirect = [301, 302, 307, 308].includes(res.status);
      
      let canonicalOk = false;
      let targetStatus = 0;
      if (isRedirect && destPath === expectedDest) {
        // Verify canonical integrity: follow to destination and ensure 200 OK
        const targetRes = await checkUrl(`${DEV_SERVER}${destPath}`);
        targetStatus = targetRes.status;
        canonicalOk = targetStatus === 200;
      }

      if (isRedirect && destPath === expectedDest && canonicalOk) {
        passedTests++;
        console.log(
          `${colors.green}✔ PASS${colors.reset} Category Redirect: ${colors.cyan}${sourcePath}${colors.reset} → ${colors.green}${expectedDest}${colors.reset} (HTTP ${res.status}, Target HTTP ${targetStatus})`
        );
      } else {
        failedTests++;
        console.log(
          `${colors.red}✘ FAIL${colors.reset} Category Redirect: ${colors.cyan}${sourcePath}${colors.reset} → Expected ${colors.yellow}${expectedDest}${colors.reset}`
        );
        console.log(`       Received Status: ${res.status}, Location: ${res.headers.location || 'none'}, Target Status: ${targetStatus}`);
      }
    } catch (err: any) {
      failedTests++;
      console.log(`${colors.red}✘ ERROR${colors.reset} Category Redirect: ${colors.cyan}${sourcePath}${colors.reset} - ${err.message}`);
    }
  }
  console.log('');

  // 2. Verify Tool-Level Redirects
  console.log(`${colors.bold}--- Testing Tool-Level Redirects ---${colors.reset}`);
  
  // We will test all 146 tool redirects from urlMap.tools
  for (const tool of urlMap.tools) {
    totalTests++;
    const sourcePath = tool.legacy_url;
    const expectedDest = tool.new_url;
    const sourceUrl = `${DEV_SERVER}${sourcePath}`;

    try {
      const res = await checkUrl(sourceUrl);
      const destPath = getNormalizedPath(res.headers.location);
      const isRedirect = [301, 302, 307, 308].includes(res.status);
      
      let canonicalOk = false;
      let targetStatus = 0;
      if (isRedirect && destPath === expectedDest) {
        // Verify canonical integrity: follow to destination and ensure 200 OK
        const targetRes = await checkUrl(`${DEV_SERVER}${destPath}`);
        targetStatus = targetRes.status;
        canonicalOk = targetStatus === 200;
      }

      if (isRedirect && destPath === expectedDest && canonicalOk) {
        passedTests++;
        console.log(
          `${colors.green}✔ PASS${colors.reset} Tool Redirect: ${colors.cyan}${sourcePath}${colors.reset} → ${colors.green}${expectedDest}${colors.reset} (HTTP ${res.status}, Target HTTP ${targetStatus})`
        );
      } else {
        failedTests++;
        console.log(
          `${colors.red}✘ FAIL${colors.reset} Tool Redirect: ${colors.cyan}${sourcePath}${colors.reset} → Expected ${colors.yellow}${expectedDest}${colors.reset}`
        );
        console.log(`       Received Status: ${res.status}, Location: ${res.headers.location || 'none'}, Target Status: ${targetStatus}`);
      }
    } catch (err: any) {
      failedTests++;
      console.log(`${colors.red}✘ ERROR${colors.reset} Tool Redirect: ${colors.cyan}${sourcePath}${colors.reset} - ${err.message}`);
    }
  }
  console.log('');

  // 3. Verify Sitemap Generation
  console.log(`${colors.bold}--- Testing Sitemap XML Integrity ---${colors.reset}`);
  try {
    const sitemapRes = await checkUrl(SITEMAP_URL);
    if (sitemapRes.status !== 200) {
      throw new Error(`Sitemap responded with HTTP status ${sitemapRes.status}`);
    }

    const xml = sitemapRes.body;
    
    // Parse urls
    const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
    let match;
    const sitemapUrls: string[] = [];
    while ((match = locRegex.exec(xml)) !== null) {
      sitemapUrls.push(match[1]);
    }

    console.log(`Found total of ${colors.cyan}${sitemapUrls.length}${colors.reset} URLs in the sitemap.`);

    // 1. All must have HTTPS prefixes
    const nonHttpsUrls = sitemapUrls.filter(url => !url.startsWith('https://'));
    const isHttpsOk = nonHttpsUrls.length === 0;

    // 2. Identify modern category URLs and tool URLs
    const targetBase = 'https://www.twistertools.com';
    const categoryUrls = sitemapUrls.filter(url => {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      // Modern category URL pattern: /tools/[category-slug]
      return parts.length === 2 && parts[0] === 'tools';
    });

    const toolUrls = sitemapUrls.filter(url => {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      // Modern tool URL pattern: /tools/[category-slug]/[tool-slug]
      return parts.length === 3 && parts[0] === 'tools';
    });

    const staticUrls = sitemapUrls.filter(url => {
      const pathname = new URL(url).pathname;
      return pathname === '/' || pathname === '/about' || pathname === '/contact' || pathname === '/privacy-policy' || pathname === '/terms-of-service' || pathname === '/categories';
    });

    console.log(`- Static pages detected: ${colors.cyan}${staticUrls.length}${colors.reset} (Expected: 6 - homepage, about, contact, privacy-policy, terms-of-service, categories)`);
    console.log(`- Category URLs detected: ${colors.cyan}${categoryUrls.length}${colors.reset} (Expected: 9)`);
    console.log(`- Tool URLs detected: ${colors.cyan}${toolUrls.length}${colors.reset} (Expected: ${toolsRegistry.length})`);

    let sitemapErrors: string[] = [];

    if (!isHttpsOk) {
      sitemapErrors.push(`Found ${nonHttpsUrls.length} non-HTTPS URLs (e.g. ${nonHttpsUrls[0]})`);
    }
    if (staticUrls.length !== 6) {
      sitemapErrors.push(`Static URL count mismatch. Found ${staticUrls.length}, expected 6.`);
    }
    if (categoryUrls.length !== 9) {
      sitemapErrors.push(`Category URL count mismatch. Found ${categoryUrls.length}, expected 9.`);
    }
    if (toolUrls.length !== toolsRegistry.length) {
      sitemapErrors.push(`Tool URL count mismatch. Found ${toolUrls.length}, expected ${toolsRegistry.length}.`);
    }

    // Verify all active tools in toolsRegistry are in the sitemap
    for (const tool of toolsRegistry) {
      const expectedSitemapUrl = `${targetBase}${tool.href}`;
      if (!sitemapUrls.includes(expectedSitemapUrl)) {
        sitemapErrors.push(`Missing active tool in sitemap: ${expectedSitemapUrl}`);
      }
    }

    // Verify all categories in urlMap are in the sitemap
    for (const cat in urlMap.modern_categories) {
      const expectedSitemapUrl = `${targetBase}/tools/${cat}`;
      if (!sitemapUrls.includes(expectedSitemapUrl)) {
        sitemapErrors.push(`Missing category in sitemap: ${expectedSitemapUrl}`);
      }
    }

    totalTests++;
    if (sitemapErrors.length === 0) {
      passedTests++;
      console.log(`${colors.green}✔ PASS${colors.reset} Sitemap verification complete: ${toolsRegistry.length} active tools, 8 category URLs, 6 static URLs validated with HTTPS protocol.`);
    } else {
      failedTests++;
      console.log(`${colors.red}✘ FAIL${colors.reset} Sitemap validation failed:`);
      sitemapErrors.forEach(err => console.log(`       - ${colors.yellow}${err}${colors.reset}`));
    }
  } catch (err: any) {
    failedTests++;
    totalTests++;
    console.log(`${colors.red}✘ ERROR${colors.reset} Sitemap verification failed - ${err.message}`);
  }

  // Final Summary
  console.log(`\n${colors.bold}${colors.cyan}====================================================`);
  console.log(`                  TEST RESULTS SUMMARY`);
  console.log(`====================================================${colors.reset}`);
  console.log(`Total tests run: ${colors.bold}${totalTests}${colors.reset}`);
  console.log(`Passed:          ${colors.green}${colors.bold}${passedTests}${colors.reset}`);
  console.log(`Failed:          ${colors.red}${colors.bold}${failedTests}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
