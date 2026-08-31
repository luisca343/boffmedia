const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const urls = [
    { url: 'http://localhost:3000/otros/mewgenics#?c=maps&id=future', name: 'future' },
    { url: 'http://localhost:3000/otros/mewgenics#?c=maps&id=moon', name: 'moon' },
    { url: 'http://localhost:3000/otros/mewgenics#?c=maps&id=alley', name: 'alley' },
    { url: 'http://localhost:3000/otros/mewgenics#?c=classes', name: 'classes' },
    { url: 'http://localhost:3000/otros/mewgenics#?c=furniture', name: 'furniture' },
    { url: 'http://localhost:3000/otros/mewgenics#?c=sets', name: 'sets' },
    { url: 'http://localhost:3000/otros/mewgenics#?c=statuses', name: 'statuses' },
  ];

  for (const entry of urls) {
    console.log(`Testing: ${entry.name}`);
    try {
      await page.goto(entry.url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);

      const screenshotPath = `/tmp/screenshot-${entry.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`  ✓ Screenshot: ${screenshotPath}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  await browser.close();
  console.log('Done');
})();
