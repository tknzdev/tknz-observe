import { test, expect } from '@playwright/test';

test('Launchpad Home: page body has content and logs', async ({ page }) => {
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.error(`PAGE ERROR: ${error.message}`);
  });
  page.on('request', request => {
    console.log(`REQUEST: ${request.method()} ${request.url()}`);
  });
  page.on('response', response => {
    console.log(`RESPONSE: ${response.status()} ${response.url()}`);
  });

  let metricsBefore = {};
  try {
    metricsBefore = await page.metrics();
  } catch (e: any) {
    console.warn('Metrics before navigation unavailable:', (e as Error).message);
  }
  console.log('Metrics before navigation:', metricsBefore);

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const bodyText = await page.evaluate(() => document.body.innerText || '');
  expect(bodyText.trim().length).toBeGreaterThan(0);

  let metricsAfter = {};
  try {
    metricsAfter = await page.metrics();
  } catch (e: any) {
    console.warn('Metrics after navigation unavailable:', (e as Error).message);
  }
  console.log('Metrics after navigation:', metricsAfter);

  const perfData = await page.evaluate(() => ({
    navigation: performance.getEntriesByType('navigation'),
    resource: performance.getEntriesByType('resource'),
    timing: performance.timing
  }));
  console.log('Performance data:', JSON.stringify(perfData, null, 2));

  const screenshotPath = 'launchpad-home.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);
});