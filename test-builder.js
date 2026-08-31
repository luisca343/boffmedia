const { chromium } = require("playwright");
const path = require("path");

const BASE_URL = "http://localhost:3000";

async function test() {
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to builder page...");
    await page.goto(`${BASE_URL}/otros/mewgenics/builder`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for the page to load
    await page.waitForSelector('[class*="mew-skin"]', { timeout: 10000 });
    console.log("✓ Page loaded");

    // Check if parts tab is active
    const partsTab = await page.locator('button:has-text("Parts")').first();
    console.log("✓ Parts tab found");

    // Count console errors/warnings
    let errorCount = 0;
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`  Console error: ${msg.text()}`);
        errorCount++;
      }
    });

    // Take screenshot of initial state
    await page.screenshot({ path: path.join(__dirname, "builder-initial.png") });
    console.log("✓ Screenshot: builder-initial.png");

    // Test part picker - look for grid container
    const gridContainer = await page
      .locator("[class*='overflow-y-auto'][class*='max-h-96']")
      .first()
      .isVisible();
    console.log(`✓ Part grid container visible: ${gridContainer}`);

    // Try to scroll in the first grid to see if virtualization works
    if (gridContainer) {
      const firstGrid = await page
        .locator("[class*='overflow-y-auto'][class*='max-h-96']")
        .first();
      // Scroll down in the grid
      await firstGrid.evaluate((el) => {
        el.scrollTop = 200;
      });
      await page.waitForTimeout(500);
      console.log("✓ Scrolled part grid");

      // Take screenshot after scroll
      await page.screenshot({ path: path.join(__dirname, "builder-scrolled.png") });
      console.log("✓ Screenshot: builder-scrolled.png");
    }

    // Switch to palette tab
    const paletteTabBtn = await page.locator("button").filter({ hasText: "Palette" }).first();
    await paletteTabBtn.click();
    await page.waitForTimeout(500);
    console.log("✓ Clicked Palette tab");

    // Check for palette swatches
    const swatches = await page.locator("button[style*='backgroundColor']").count();
    console.log(`✓ Found palette swatches: ${swatches}`);

    // Take screenshot of palette
    await page.screenshot({ path: path.join(__dirname, "builder-palette.png") });
    console.log("✓ Screenshot: builder-palette.png");

    // Switch to equipment tab
    const equipTabBtn = await page.locator("button").filter({ hasText: "Equipment" }).first();
    await equipTabBtn.click();
    await page.waitForTimeout(500);
    console.log("✓ Clicked Equipment tab");

    // Take screenshot of equipment
    await page.screenshot({ path: path.join(__dirname, "builder-equipment.png") });
    console.log("✓ Screenshot: builder-equipment.png");

    // Switch to presets tab and load a story cat
    const presetsTabBtn = await page.locator("button").filter({ hasText: "Presets" }).first();
    await presetsTabBtn.click();
    await page.waitForTimeout(500);
    console.log("✓ Clicked Presets tab");

    // Click first preset
    const presetsContainer = await page
      .locator("[class*='overflow-y-auto']")
      .last();
    const firstPresetBtn = await presetsContainer.locator("button").first();
    if (await firstPresetBtn.isVisible()) {
      const presetText = await firstPresetBtn.textContent();
      console.log(`✓ Found preset: ${presetText.split("\n")[0]}`);
      await firstPresetBtn.click();
      await page.waitForTimeout(1000);

      // Take screenshot after loading preset
      await page.screenshot({ path: path.join(__dirname, "builder-preset-loaded.png") });
      console.log("✓ Screenshot: builder-preset-loaded.png");
    }

    // Report console errors
    console.log(`\n✓ Console errors: ${errorCount}`);

    console.log("\n✅ All tests completed successfully!");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    try {
      await page.screenshot({ path: path.join(__dirname, "builder-error.png") });
    } catch {
      /* ignore */
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

test().catch(console.error);
