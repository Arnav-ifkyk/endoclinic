// tests/e2e/theme-screenshots.spec.js — captures 390x844 light & dark screenshots and checks layout/console
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const OUT_DIR = 'C:/Users/arnav/.gemini/antigravity/brain/1b50718d-b189-472a-946d-61a2cafb5560/scratch/screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

test.use({ serviceWorkers: 'block' });

test('capture light and dark screenshots at 390x844', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  // 1. Sign-in screen (with real config.js active)
  await page.goto('/');
  await page.waitForSelector('.login h1');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT_DIR, 'signin-light.png') });

  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(OUT_DIR, 'signin-dark.png') });

  // 2. Demo mode for authenticated clinic views (mocking config.js in test route only)
  await page.route('**/config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.ENDO_CONFIG = { supabaseUrl: '', supabaseAnonKey: '', clinic: { doctorName: 'Dr. Vijay Shripad Dhawle', qualifications: ['DCH DNB PEDIATRICS'], regdNo: '81887', address: 'Latur Diabetes Centre, Latur', phones: 'Tel. 02382-250213', greetingName: 'Dr. Dhawle' } };`,
  }));

  await page.goto('/');
  await page.waitForSelector('.hello h1');

  // Seed realistic patients + visits via Store
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
      birth: { term: 'Full term', aga: 'AGA', weight: '3.1', nicu: 'No' },
    });
    const p2 = await window.Store.save('patients', {
      id: '22222222-2222-4222-8222-222222222222',
      code: 'PE-1089B',
      name: 'Gargi Deshmukh',
      sex: 'F',
      dob: '2013-10-15',
      phone: '9422012345',
      fatherHt: '172',
      motherHt: '158',
    });
    await window.Store.save('visits', {
      id: '33333333-3333-4333-8333-333333333331',
      patientId: p1.id,
      date: '2025-05-15',
      height: '124.2',
      weight: '24.5',
      boneAge: '7.5',
      notes: { diagnosis: 'Familial short stature' },
    });
    await window.Store.save('visits', {
      id: '33333333-3333-4333-8333-333333333332',
      patientId: p1.id,
      date: today,
      height: '128.0',
      weight: '26.2',
      boneAge: '8.2',
      notes: { nextVisit: today, diagnosis: 'Familial short stature' },
    });
    await window.Store.save('visits', {
      id: '33333333-3333-4333-8333-333333333333',
      patientId: p2.id,
      date: '2026-10-20',
      height: '153.5',
      weight: '45.0',
      notes: { nextVisit: today },
    });
    return p1.id;
  });

  await page.reload();
  await page.waitForSelector('.pcard');
  await page.evaluate(() => document.fonts.ready);

  const checkOverflow = async () => {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(390);
  };

  // Home / Today (Light & Dark)
  await checkOverflow();
  await page.screenshot({ path: path.join(OUT_DIR, 'home-light.png') });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(OUT_DIR, 'home-dark.png') });
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });

  // Patient page (Light & Dark)
  await page.goto(`/#/p/${pid}`);
  await page.waitForSelector('.hero .nm');
  await checkOverflow();
  await page.screenshot({ path: path.join(OUT_DIR, 'patient-light.png') });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(OUT_DIR, 'patient-dark.png') });
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });

  // Add Visit page (Light & Dark)
  await page.goto(`/#/p/${pid}/visit/new`);
  await page.waitForSelector('#vForm');
  await page.fill('input[name="height"]', '128.4');
  await page.fill('input[name="weight"]', '26.5');
  await checkOverflow();
  await page.screenshot({ path: path.join(OUT_DIR, 'visit-light.png') });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(OUT_DIR, 'visit-dark.png') });
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });

  // Settings page (Light & Dark via actual UI toggle!)
  await page.goto('/#/settings');
  await page.waitForSelector('.settings');
  await checkOverflow();
  await page.screenshot({ path: path.join(OUT_DIR, 'settings-light.png') });
  await page.click('[data-act="theme"][data-v="dark"]');
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(OUT_DIR, 'settings-dark.png') });

  expect(errors).toEqual([]);
});
