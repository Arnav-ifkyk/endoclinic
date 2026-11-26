// tests/e2e/appointments.spec.js — tests calendar + booking for existing and new patients
const { test, expect } = require('@playwright/test');
const path = require('node:path');

const OUT_DIR = 'C:/Users/arnav/.gemini/antigravity/brain/1b50718d-b189-472a-946d-61a2cafb5560/scratch/screenshots';

test.use({ serviceWorkers: 'block' });

test('appointments tab, calendar, and booking for existing and new patients', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.route('**/config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.ENDO_CONFIG = { supabaseUrl: '', supabaseAnonKey: '', clinic: { doctorName: 'Dr. Vijay Shripad Dhawle', greetingName: 'Dr. Dhawle' } };`,
  }));

  await page.goto('/app.html');
  await page.waitForSelector('.hello h1');

  await page.evaluate(async () => {
    await window.Store.save('patients', {
      id: '11111111-1111-4111-8111-111111111111',
      code: 'PE-1042A',
      name: 'Aarav Kulkarni',
      sex: 'M',
      dob: '2016-05-12',
      phone: '9850631399',
    });
  });

  // Open Appointments tab
  await page.click('[data-act="nav"][data-to="/appointments"]');
  await page.waitForSelector('.cal-grid');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  // Book for Existing patient
  await page.click('[data-act="bookNew"]');
  await page.waitForSelector('#apForm');
  await page.click('[data-act="pickPatient"][data-id="11111111-1111-4111-8111-111111111111"]');
  await page.click('[data-act="apTime"][data-v="10:00"]');
  await page.fill('input[name="ap_reason"]', 'Growth review');
  await page.click('[data-act="saveAppt"]');
  await page.waitForSelector('.appt-card');

  // Book for New patient
  await page.click('[data-act="bookNew"]');
  await page.click('[data-act="bookTab"][data-v="new"]');
  await page.fill('input[name="ap_name"]', 'Riya Joshi');
  await page.click('[data-act="apSex"][data-v="F"]');
  await page.fill('input[name="ap_phone"]', '9823001122');
  await page.click('[data-act="apTime"][data-v="11:00"]');
  await page.screenshot({ path: path.join(OUT_DIR, 'book-new-light.png') });
  await page.click('[data-act="saveAppt"]');

  await page.waitForSelector('.appt-card');
  const cards = await page.locator('.appt-card').count();
  expect(cards).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: path.join(OUT_DIR, 'appointments-light.png') });

  expect(errors).toEqual([]);
});
