// tests/growth.test.js — clinical growth calculation verification (WHO 2006 + IAP 2015)
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadGrowth() {
  const root = path.resolve(__dirname, '..');
  const ctx = { console, Math, Date, Number, String, Array, Object, isFinite, parseFloat };
  ctx.globalThis = ctx;
  ctx.window = ctx;
  vm.createContext(ctx);
  const refCode = fs.readFileSync(path.join(root, 'refdata.js'), 'utf8');
  vm.runInContext(refCode + '\nwindow.REF = REF;\n', ctx, { filename: 'refdata.js' });
  const growthCode = fs.readFileSync(path.join(root, 'growth.js'), 'utf8');
  vm.runInContext(growthCode, ctx, { filename: 'growth.js' });
  const helpersCode = fs.readFileSync(path.join(root, 'helpers.js'), 'utf8');
  vm.runInContext(helpersCode, ctx, { filename: 'helpers.js' });
  return { G: ctx.Growth, H: ctx.Helpers };
}

const { G, H } = loadGrowth();

function assertClose(actual, expected, tol = 1e-3, msg = '') {
  assert.ok(actual != null && Number.isFinite(actual), `Expected finite number, got ${actual} ${msg}`);
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: expected ${expected} ± ${tol}, got ${actual}`);
}

describe('IAP 2015 height and weight centile interpolation', () => {
  it('matches published IAP Table IV for girls height at 13.0 y exactly', () => {
    const expected = [
      [3, 138.2], [10, 142.9], [25, 147.6], [50, 152.2],
      [75, 156.8], [90, 161.3], [97, 165.9],
    ];
    for (const [p, ht] of expected) {
      assertClose(G.sds('h', 'F', 13.0, ht), G.normInv(p / 100), 1e-3, `Girls 13y ${p}th`);
    }
  });

  it('matches published IAP girls height at 18.0 y', () => {
    assertClose(G.sds('h', 'F', 18.0, 146.6), G.normInv(0.03), 1e-3, 'Girls 18y 3rd');
    assertClose(G.sds('h', 'F', 18.0, 157.8), 0, 1e-3, 'Girls 18y 50th');
    assertClose(G.sds('h', 'F', 18.0, 170.6), G.normInv(0.97), 1e-3, 'Girls 18y 97th');
  });

  it('matches published IAP boys height at 10.0 y', () => {
    assertClose(G.sds('h', 'M', 10.0, 123.6), G.normInv(0.03), 1e-3, 'Boys 10y 3rd');
    assertClose(G.sds('h', 'M', 10.0, 137.2), 0, 1e-3, 'Boys 10y 50th');
    assertClose(G.sds('h', 'M', 10.0, 151.4), G.normInv(0.97), 1e-3, 'Boys 10y 97th');
  });

  it('matches published IAP girls weight at 14.5 y 97th centile', () => {
    assertClose(G.sds('w', 'F', 14.5, 71.4), G.normInv(0.97), 1e-3, 'Girls 14.5y wt 97th');
  });
});

describe('IAP 2015 BMI cut-offs and WHO 2006 standards', () => {
  it('matches boys BMI overweight (23) and obese (27) cut-offs at 10.0 y', () => {
    const cut = G.bmiCutoffs('M', 10.0);
    assert.equal(cut.ov, 18.0);
    assert.equal(cut.ob, 20.5);
    assert.equal(G.bmiCategory('M', 10.0, 17.9), 'Normal');
    assert.equal(G.bmiCategory('M', 10.0, 18.0), 'Overweight');
    assert.equal(G.bmiCategory('M', 10.0, 20.5), 'Obese');
  });

  it('matches WHO 2006 boys length median at 12 months (z = 0)', () => {
    assertClose(G.sds('h', 'M', 1.0, 75.7488), 0, 1e-3, 'WHO boys 12m length');
  });

  it('returns null BMI SDS and category under 2 years', () => {
    assert.equal(G.sds('b', 'M', 1.5, 16.2), null);
    assert.equal(G.bmiCategory('M', 1.5, 16.2), null);
  });
});

describe('MPH, BMI, age, and height velocity', () => {
  it('computes MPH correctly (father 170, mother 150 -> boy 166.5, girl 153.5)', () => {
    const boy = G.mph('M', 170, 150);
    const girl = G.mph('F', 170, 150);
    assert.equal(boy.value, 166.5);
    assert.equal(boy.low, 158.0);
    assert.equal(boy.high, 175.0);
    assert.equal(girl.value, 153.5);
    assert.equal(girl.low, 145.0);
    assert.equal(girl.high, 162.0);
    assertClose(girl.sds, G.sds('h', 'F', 18.0, 153.5), 1e-6);
  });

  it('computes BMI and age accurately', () => {
    assertClose(G.bmi(150, 45), 20.0, 1e-6);
    assert.equal(G.ageText(5.5), '5 y 6 m');
  });

  it('computes height velocity using nearest earlier visit >= 4 months apart', () => {
    const p = { id: 'p1', sex: 'M', dob: '2016-01-01' };
    const vs = [
      { id: 'v1', date: '2025-01-01', height: '130' },
      { id: 'v2', date: '2025-09-01', height: '134' },
      { id: 'v3', date: '2025-11-01', height: '135' },
    ];
    // Nearest earlier visit >= 0.33 y before 2025-11-01 is 2025-01-01 (v2 is only 2 mo earlier)
    const hv = G.heightVelocity(p, vs, vs[2]);
    assert.ok(hv);
    assertClose(hv.cmPerYear, 5 / G.ageYears('2025-01-01', '2025-11-01'), 1e-4);
  });
});

describe('Preterm corrected age, clinical flags, and duplicate detection', () => {
  it('applies preterm corrected age under 2 y chronological age and switches off at >= 2 y', () => {
    const p = { id: 'pt1', sex: 'M', dob: '2025-01-01', birth: { term: 'Preterm', gestWeeks: '32' } };
    // At 1 y chrono (2026-01-01), 8 weeks correction -> ~0.847 y (~10 m)
    const r1 = G.analyse(p, { date: '2026-01-01', height: '72', weight: '8.5' });
    assert.equal(r1.isCorrected, true);
    assert.ok(r1.age < 0.9 && r1.age > 0.8);
    // At 2.5 y chrono (2027-07-01), no correction
    const r2 = G.analyse(p, { date: '2027-07-01', height: '90', weight: '13' });
    assert.equal(r2.isCorrected, false);
    assertClose(r2.age, r2.chronoAge, 1e-6);
  });

  it('flags pre-term < 40 wk CGA without extrapolating WHO below 0', () => {
    const p = { id: 'pt2', sex: 'F', dob: '2026-01-01', birth: { term: 'Preterm', gestWeeks: '32' } };
    const r = G.analyse(p, { date: '2026-01-20', height: '44', weight: '2.1' });
    assert.equal(r.preTermCga, true);
    assert.equal(r.hSds, null);
    assert.equal(r.ageText, 'Pre-term (<40 wk CGA)');
  });

  it('triggers neutral clinical flags for short stature, MPH gap, centile drop, BMI, and extreme SDS', () => {
    const p = { id: 'fl1', sex: 'F', dob: '2013-01-01', fatherHt: '175', motherHt: '165' };
    const v1 = { id: 'v1', date: '2024-01-01', height: '146', weight: '38' };
    const v2 = { id: 'v2', date: '2026-01-01', height: '136', weight: '62' };
    const flags = G.clinicalFlags(p, [v1, v2], v2, { hvThreshold: 4 });
    const codes = flags.map(f => f.code);
    assert.ok(codes.includes('short'));
    assert.ok(codes.includes('mph_gap'));
    assert.ok(codes.includes('hv_low'));
    assert.ok(codes.includes('centile_drop'));
    assert.ok(codes.includes('bmi'));

    const vExt = { id: 'v3', date: '2026-02-01', height: '50', weight: '30' };
    const extFlags = G.clinicalFlags(p, [vExt], vExt, { hvThreshold: 4 });
    assert.ok(extFlags.some(f => f.code === 'extreme'));
  });

  it('detects duplicate patients by name+DOB or phone+similar name', () => {
    const existing = [
      { id: '1', name: 'Aarav Sharma', dob: '2018-05-10', phone: '9850631399' },
    ];
    assert.equal(H.findDuplicates(existing, { name: 'aarav sharma', dob: '2018-05-10', phone: '' }).length, 1);
    assert.equal(H.findDuplicates(existing, { name: 'Aarav S', dob: '2018-05-11', phone: '+91 9850631399' }).length, 1);
    assert.equal(H.findDuplicates(existing, { name: 'Diya Patel', dob: '2018-05-10', phone: '9850631399' }).length, 0);
  });
});
