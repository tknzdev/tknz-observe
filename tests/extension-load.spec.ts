import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Toggle this test by setting PW_EXTENSION_TEST=1 in your environment
const runExtensionTest = !!process.env.PW_EXTENSION_TEST;
test('TKNZ extension loads and popup opens', async ({ browserName }, testInfo) => {
  test.skip(!runExtensionTest, 'Skipping extension test; set PW_EXTENSION_TEST=1 to run');
  test.skip(browserName !== 'chromium', 'Extension support only on Chromium');
  const extensionPath = path.resolve(__dirname, '../../tknz-extension/dist');
  
  
  // Create a unique temporary profile directory for this test
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-extension-'));
  // Launch a persistent Chromium context with the extension loaded
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
    viewport: { width: 1280, height: 720 }
  });
  // Wait for the extension's service worker registration
  const sw = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 10000 });
  const swUrl = sw.url();
  const extensionId = new URL(swUrl).host;
  console.log('Detected extension ID:', extensionId);
  // Open the extension popup page
  const page = await context.newPage();
  const popupUrl = `chrome-extension://${extensionId}/index.html`;
  await page.goto(popupUrl, { waitUntil: 'domcontentloaded' });
  // Basic check: title or body contains the extension name
  const title = await page.title();
  console.log('Popup page title:', title);
  expect(title).toBeTruthy();
  // Screenshot the popup
  const ssPath = 'extension-popup.png';
  await page.screenshot({ path: ssPath, fullPage: true });
  console.log(`Saved extension popup screenshot to ${ssPath}`);
  await context.close();
});