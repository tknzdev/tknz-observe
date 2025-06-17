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
  // Navigate to launchpad
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  // Check the extension injected a global provider
  const hasTknz = await page.evaluate(() => typeof (window as any).tknz !== 'undefined');
  expect(hasTknz).toBe(true);
  // Screenshot for verification
  await page.screenshot({ path: 'launchpad-with-extension.png', fullPage: true });
  await context.close();
}, { timeout: 60000 });