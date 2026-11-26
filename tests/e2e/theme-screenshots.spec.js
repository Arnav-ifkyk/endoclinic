// tests/e2e/theme-screenshots.spec.js — captures 390x844 dark-mode screenshots and checks layout/console
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const OUT_DIR = 'C:/Users/arnav/.gemini/antigravity/brain/1b50718d-b189-472a-946d-61a2cafb5560/scratch/screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

test.use({ serviceWorkers: 'block' });

test('capture dark theme screenshots at 390x844', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForSelector('.login h1');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT_DIR, 'signin-dark.png') });

  await page.route('**/config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.ENDO_CONFIG = { supabaseUrl: '', supabaseAnonKey: '', clinic: { doctorName: 'Dr. Vijay Shripad Dhawle', qualifications: ['DCH DNB PEDIATRICS'], regdNo: '81887', address: 'Latur Diabetes Centre, Latur', phones: 'Tel. 02382-250213', greetingName: 'Dr. Dhawle' } };`,
  }));

  await page.goto('/');
  await page.waitForSelector('.hello h1');

  const pid = await page.evaluate(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const p1 = await window.Store.save('patients', {
      id: '11111111-1111-4111-8111-111111111111',
      code: 'PE-1042A',
      name: 'Aarav Kulkarni',
      sex: 'M',
      dob: '2016-05-12',
      phone: '9850631399',
      fatherHt: '170',
      motherHt: '156',
    });
    await window.Store.save('visits', {
      id: '33333333-3333-4333-8333-333333333332',
      patientId: p1.id,
      date: today,
      height: '128.0',
      weight: '26.2',
      notes: { nextVisit: today },
    });
    return p1.id;
  });

  await page.reload();
  await page.waitForSelector('.pcard');

  const checkOverflow = async () => {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(390);
  };

  await checkOverflow();
  await page.screenshot({ path: path.join(OUT_DIR, 'home-dark.png') });

  await page.goto(`/#/p/${pid}`);
  await page.waitForSelector('.hero .nm');
  await checkOverflow();
  await page.screenshot({ path: path.join(OUT_DIR, 'patient-dark.png') });

  await page.goto('/#/settings');
  await page.waitForSelector('.settings');
  await checkOverflow();
  await page.screenshot({ path: path.join(OUT_DIR, 'settings-dark.png') });

  expect(errors).toEqual([]);
});
