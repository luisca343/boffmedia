const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let errorCount = 0;
  let consoleCount = 0;

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[${msg.type()}] ${msg.text()}`);
      errorCount++;
    }
  });

  page.on('pageerror', err => {
    console.log(`[PageError] ${err.message}`);
    errorCount++;
  });

  const urls = [
    'http://localhost:3000/otros/mewgenics#?c=maps&id=future',
    'http://localhost:3000/otros/mewgenics#?c=maps&id=moon',
    'http://localhost:3000/otros/mewgenics#?c=maps&id=alley',
  ];

  for (const url of urls) {
    errorCount = 0;
    console.log(`\n=== ${url.split('id=')[1]} ===`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Scroll to see the map
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(1000);
      
      const screenshotPath = `/tmp/screenshot-${url.split('id=')[1]}-full.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot: ${screenshotPath}`);
      console.log(`Errors: ${errorCount}`);
    } catch (err) {
      console.error(`Failed: ${err.message}`);
    }
  }

  await browser.close();
})();
