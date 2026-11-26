// growth.js — age, BMI, SDS (z-scores), centile curves.
// 0–5 y: WHO 2006 LMS.  5–18 y: IAP 2015 (height & weight from the published
// centile tables, BMI from LMS fitted to the published BMI table).
(function (global) {
  'use strict';
  if (typeof REF !== 'undefined' && !global.REF) global.REF = REF;
  const IAP_P = [3, 10, 25, 50, 75, 90, 97];

  // ---------- normal distribution ----------
  function normCdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014327 * Math.exp(-z * z / 2);
    const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z >= 0 ? 1 - p : p;
  }
  function normInv(p) { // Acklam
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const Z_IAP = IAP_P.map(p => normInv(p / 100));

  // ---------- LMS ----------
  function lmsZ(x, L, M, S) { return Math.abs(L) < 1e-7 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S); }
  function lmsX(z, L, M, S) { return Math.abs(L) < 1e-7 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L); }

  function interpRows(rows, key) { // rows sorted by row[0]; returns interpolated row
    if (key <= rows[0][0]) return rows[0].slice();
    const last = rows[rows.length - 1];
    if (key >= last[0]) return last.slice();
    let i = 1; while (rows[i][0] < key) i++;
    const a = rows[i - 1], b = rows[i], f = (key - a[0]) / (b[0] - a[0]);
    return a.map((v, j) => v + (b[j] - v) * f);
  }

  // ---------- reference lookup ----------
  // measure: 'h' | 'w' | 'b' ; sex: 'M' | 'F' ; ageY: decimal years
  function sexKey(sex) { return sex === 'F' ? 'g' : 'b'; }
  function minAge(measure) { return measure === 'b' ? 2 : 0; }

  function refAt(measure, sex, ageY) {
    const s = sexKey(sex);
    if (ageY < 5) {
      const t = global.REF['who_' + measure + '_' + s];
      const r = interpRows(t, Math.max(ageY * 12, t[0][0]));
      return { type: 'lms', L: r[1], M: r[2], S: r[3] };
    }
    if (measure === 'b') {
      const r = interpRows(global.REF['iap_b_' + s], ageY * 12);
      return { type: 'lms', L: r[1], M: r[2], S: r[3] };
    }
    const r = interpRows(global.REF['iap_' + measure + '_' + s], Math.min(ageY, 18));
    return { type: 'cent', logv: r.slice(1).map(Math.log) };
  }

  // piecewise-linear in (z, log value) through the published centiles; extends linearly beyond 3rd/97th
  function centZ(x, logv) {
    const lx = Math.log(x), n = logv.length;
    let i;
    if (lx <= logv[1]) i = 0; else if (lx >= logv[n - 2]) i = n - 2;
    else { i = 1; while (logv[i + 1] < lx) i++; }
    return Z_IAP[i] + (lx - logv[i]) * (Z_IAP[i + 1] - Z_IAP[i]) / (logv[i + 1] - logv[i]);
  }
  function centX(z, logv) {
    const n = Z_IAP.length;
    let i;
    if (z <= Z_IAP[1]) i = 0; else if (z >= Z_IAP[n - 2]) i = n - 2;
    else { i = 1; while (Z_IAP[i + 1] < z) i++; }
    return Math.exp(logv[i] + (z - Z_IAP[i]) * (logv[i + 1] - logv[i]) / (Z_IAP[i + 1] - Z_IAP[i]));
  }

  function sds(measure, sex, ageY, value) {
    if (value == null || !(value > 0) || ageY == null || ageY < minAge(measure) || ageY > 18.5) return null;
    const r = refAt(measure, sex, ageY);
    return r.type === 'lms' ? lmsZ(value, r.L, r.M, r.S) : centZ(value, r.logv);
  }
  function valueAtZ(measure, sex, ageY, z) {
    const r = refAt(measure, sex, ageY);
    return r.type === 'lms' ? lmsX(z, r.L, r.M, r.S) : centX(z, r.logv);
  }

  // IAP BMI adult-equivalent cut-offs (23 = overweight, 27 = obese), from the published table, 5–18 y
  function bmiCutoffs(sex, ageY) {
    if (ageY < 5) return null;
    const r = interpRows(global.REF['iap_b_' + sexKey(sex) + '_raw'], Math.min(ageY, 18));
    return { ov: r[6], ob: r[7] };
  }
  function bmiCategory(sex, ageY, bmi) {
    if (bmi == null || ageY == null) return null;
    if (ageY < 2) return null;
    if (ageY < 5) {
      const z = sds('b', sex, ageY, bmi);
      return z > 3 ? 'Obese' : z > 2 ? 'Overweight' : z < -2 ? 'Thin' : 'Normal';
    }
    const c = bmiCutoffs(sex, ageY), z = sds('b', sex, ageY, bmi);
    return bmi >= c.ob ? 'Obese' : bmi >= c.ov ? 'Overweight' : z < Z_IAP[0] ? 'Below 3rd centile' : 'Normal';
  }

  // ---------- dates & derived values ----------
  function parseDate(s) { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
  function ageYears(dob, date) {
    const a = parseDate(dob), b = parseDate(date);
    if (!a || !b) return null;
    return (b - a) / (365.25 * 86400000);
  }
  function ageText(ageY) {
    if (ageY == null || ageY < 0) return '—';
    let y = Math.floor(ageY + 1e-9), m = Math.floor((ageY - y) * 12 + 1e-6);
    if (m === 12) { y++; m = 0; }
    return y + ' y ' + m + ' m';
  }
  function bmi(heightCm, weightKg) {
    if (!(heightCm > 0) || !(weightKg > 0)) return null;
    const h = heightCm / 100; return weightKg / (h * h);
  }
  function mph(sex, fatherCm, motherCm) {
    if (!(fatherCm > 0) || !(motherCm > 0)) return null;
    const v = (fatherCm + motherCm + (sex === 'F' ? -13 : 13)) / 2;
    return { value: v, low: v - 8.5, high: v + 8.5, sds: sds('h', sex, 18, v) };
  }
  function centileOf(z) { return z == null ? null : normCdf(z) * 100; }
  function centileText(z) {
    if (z == null) return '—';
    const c = centileOf(z);
    if (c < 0.1) return '<0.1st'; if (c > 99.9) return '>99.9th';
    const v = c < 1 || c > 99 ? c.toFixed(1) : Math.round(c);
    const n = Math.round(Number(v)), suf = (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return v + suf;
  }

  // Compute all derived figures for one visit
  function analyse(patient, visit) {
    const age = ageYears(patient.dob, visit.date);
    const h = num(visit.height), w = num(visit.weight);
    const b = bmi(h, w);
    const out = {
      age, ageText: ageText(age), height: h, weight: w, bmi: b,
      hSds: sds('h', patient.sex, age, h),
      wSds: sds('w', patient.sex, age, w),
      bSds: sds('b', patient.sex, age, b),
      bmiCat: bmiCategory(patient.sex, age, b),
    };
    return out;
  }
  // height velocity from the latest visit and the closest earlier visit at least 4 months before
  function heightVelocity(patient, visitsSorted, uptoVisit) {
    const list = visitsSorted.filter(v => num(v.height) > 0 && v.date <= uptoVisit.date);
    const last = list[list.length - 1];
    if (!last) return null;
    for (let i = list.length - 2; i >= 0; i--) {
      const dt = ageYears(list[i].date, last.date);
      if (dt >= 0.33) return { cmPerYear: (num(last.height) - num(list[i].height)) / dt, overYears: dt };
    }
    return null;
  }
  function num(v) { const n = parseFloat(v); return isFinite(n) ? n : null; }

  // centile curve points for drawing
  function curve(measure, sex, z, fromY, toY) {
    const pts = [];
    const start = Math.max(fromY, minAge(measure));
    for (let a = start; a <= toY + 1e-9; a += (a < 5 ? 1 / 12 : 0.25)) pts.push([a, valueAtZ(measure, sex, a, z)]);
    if (pts.length && pts[pts.length - 1][0] < toY) pts.push([toY, valueAtZ(measure, sex, toY, z)]);
    return pts;
  }
  // IAP adult-equivalent 23 (overweight) / 27 (obese) lines, 5–18 y (under 5, WHO +2/+3 SD is used for the category only)
  function cutoffCurve(sex, key, fromY, toY) {
    const pts = [];
    for (let a = Math.max(5, fromY); a <= toY + 1e-9; a += 0.25) pts.push([a, bmiCutoffs(sex, a)[key]]);
    return pts;
  }
  const BMI_P = [3, 5, 10, 25, 50];

  global.Growth = { IAP_P, BMI_P, Z_IAP, normCdf, normInv, sds, valueAtZ, analyse, heightVelocity, mph, bmi, ageYears, ageText,
    centileOf, centileText, curve, cutoffCurve, bmiCutoffs, bmiCategory, num, minAge };
})(typeof window !== 'undefined' ? window : globalThis);
