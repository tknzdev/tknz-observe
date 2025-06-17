import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Run integration only when env flag is set
const runIntegration = !!process.env.PW_EXTENSION_TEST;

test('Launchpad with TKNZ extension provider injected', async () => {
  test.skip(!runIntegration, 'Skipping extension integration test; set PW_EXTENSION_TEST=1 to run');
  // Prepare extension path and temporary profile
  const extensionPath = path.resolve(__dirname, '../../tknz-extension/dist');
  console.log('TEST LOG: using extensionPath =', extensionPath);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));
  // Launch Chromium with the extension loaded
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  // Preload extension storage state via extension popup page
  const statePath = path.resolve(__dirname, '../test-data/extension-state.json');
  if (fs.existsSync(statePath)) {
    const stateJson = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    // Determine extension ID from service worker URL
    const sw = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 10000 });
    const extensionId = new URL(sw.url()).host;
    const extensionUrl = `chrome-extension://${extensionId}/index.html`;
    const extPage = await context.newPage();
    console.log('TEST LOG: preloading extension storage via popup:', extensionUrl);
    await extPage.goto(extensionUrl, { waitUntil: 'domcontentloaded' });
    // Inject storage data into extension context
    await extPage.evaluate((state) => {
      return new Promise<void>((resolve) => {
        chrome.storage.local.set(state, () => resolve());
      });
    }, stateJson);
    await extPage.close();
  } else {
    console.warn('TEST WARN: extension-state.json not found, skipping preload');
  }
  // Capture browser console messages
  page.on('console', msg => console.log(`PAGE CONSOLE ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`PAGE ERROR: ${err.message}`));
  // Navigate to launchpad
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  // Wait for SDK injection to define window.tknz
  await page.waitForFunction(() => typeof (window as any).tknz !== 'undefined', { timeout: 10000 });
  const keys = await page.evaluate(() => Object.keys((window as any).tknz));
  console.log('PAGE LOG: window.tknz keys:', keys);
  expect(keys.length).toBeGreaterThan(0);
  // Screenshot for verification
  await page.screenshot({ path: 'launchpad-with-extension.png', fullPage: true });
  await context.close();
}, { timeout: 60000 });