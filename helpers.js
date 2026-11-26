// helpers.js — duplicate detection, dose calculators, CSV parsing/export
(function (global) {
  'use strict';

  function normName(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function normPhone(s) {
    const d = String(s || '').replace(/\D/g, '');
    return d.length >= 10 ? d.slice(-10) : d;
  }
  function nameSimilar(a, b) {
    const na = normName(a), nb = normName(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    const wa = na.split(' '), wb = nb.split(' ');
    if (wa[0] && wb[0] && wa[0] === wb[0] && (wa.length === 1 || wb.length === 1 || na.includes(wb[0]) || nb.includes(wa[0]))) return true;
    // Levenshtein ratio for short names
    const m = na.length, n = nb.length;
    if (Math.abs(m - n) > 4) return false;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (na[i - 1] === nb[j - 1] ? 0 : 1));
      }
    }
    return 1 - dp[m][n] / Math.max(m, n) >= 0.75;
  }

  /** Find potential duplicate patients (same name + DOB, or same phone + similar name). */
  function findDuplicates(patients, candidate, ignoreId) {
    const cName = normName(candidate.name), cDob = candidate.dob || '', cPhone = normPhone(candidate.phone);
    const out = [];
    for (const p of patients || []) {
      if (!p || p.deleted || (ignoreId && p.id === ignoreId)) continue;
      const sameNameDob = cName && cDob && normName(p.name) === cName && p.dob === cDob;
      const samePhoneSim = cPhone.length >= 7 && normPhone(p.phone) === cPhone && nameSimilar(p.name, candidate.name);
      if (sameNameDob) out.push({ patient: p, reason: 'Same name and date of birth' });
      else if (samePhoneSim) out.push({ patient: p, reason: 'Same phone number and similar name' });
    }
    return out;
  }

  /** Mosteller BSA in m^2. */
  function bsaMosteller(heightCm, weightKg) {
    if (!(heightCm > 0) || !(weightKg > 0)) return null;
    return Math.sqrt((heightCm * weightKg) / 3600);
  }

  /** Dose calculators (display helpers only; doctor always chooses dose). */
  function calcGhDose(weeklyMgPerKg, weightKg, heightCm) {
    if (!(weeklyMgPerKg > 0) || !(weightKg > 0)) return null;
    const weeklyMg = weeklyMgPerKg * weightKg;
    const dailyMg = weeklyMg / 7;
    const bsa = bsaMosteller(heightCm, weightKg);
    return { weeklyMg, dailyMg, bsa, mgPerM2Week: bsa ? weeklyMg / bsa : null };
  }
  function calcDailyPerKg(dosePerKgDay, weightKg) {
    if (!(dosePerKgDay > 0) || !(weightKg > 0)) return null;
    return dosePerKgDay * weightKg;
  }

  global.Helpers = {
    normName, normPhone, nameSimilar, findDuplicates,
    bsaMosteller, calcGhDose, calcDailyPerKg,
  };
})(typeof window !== 'undefined' ? window : globalThis);
