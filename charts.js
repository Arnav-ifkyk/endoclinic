// charts.js — SVG growth charts (screen + A4 print), drawn from Growth.* curves
(function (global) {
  'use strict';
  const G = () => global.Growth;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f1 = v => (Math.round(v * 10) / 10).toFixed(1);

  const THEME = {
    screen: { grid: '#ede7d6', gridMajor: '#dbd2b8', axis: '#664a42', cent: '#7d6a60', median: '#0f2a10', text: '#664a42',
      sdRed: '#8C2611', h: '#8C2611', w: '#1B6B6E', ba: '#1C1A52', mph: '#3f6b2b', ov: '#D6A516', ob: '#8C2611', bg: '#fdfbf4' },
    print: { grid: '#e8dff2', gridMajor: '#c7b6dd', axis: '#2b1b3d', cent: '#6a568f', median: '#2b1b3d', text: '#3b2a57',
      sdRed: '#c81e1e', h: '#c2410c', w: '#0f6b66', ba: '#1e3a8a', mph: '#a16207', ov: '#ea7a0c', ob: '#c81e1e', bg: '#ffffff' },
  };

  /**
   * opts: { measure: 'h'|'w'|'b'|'hw', sex, points: [{age, h, w, b, ba}], mph, x0, x1, y0, y1, W, H, mode: 'screen'|'print' }
   */
  function render(o) {
    const T = THEME[o.mode || 'screen'];
    const W = o.W || 360, H = o.H || 300;
    const m = { l: o.mode === 'print' ? 40 : 38, r: o.mode === 'print' ? 42 : 44, t: 16, b: 30 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const { x0, x1, y0, y1 } = o;
    const sx = a => m.l + (a - x0) / (x1 - x0) * pw;
    const sy = v => m.t + (1 - (v - y0) / (y1 - y0)) * ph;
    const fs = o.mode === 'print' ? 8 : 10;
    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="gchart" role="img" font-family="Manrope, sans-serif" style="font-variant-numeric:tabular-nums">`);
    out.push(`<defs><clipPath id="clip-${o.id || 'c'}"><rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/></clipPath></defs>`);
    out.push(`<rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="${T.bg}"/>`);

    // ---- grid ----
    const span = x1 - x0;
    const xMinor = span <= 3 ? 1 / 12 : span <= 8 ? 0.25 : 0.5;
    for (let a = Math.ceil(x0 / xMinor) * xMinor; a <= x1 + 1e-9; a += xMinor) {
      const major = Math.abs(a - Math.round(a)) < 1e-6;
      out.push(`<line x1="${sx(a)}" x2="${sx(a)}" y1="${m.t}" y2="${m.t + ph}" stroke="${major ? T.gridMajor : T.grid}" stroke-width="${major ? 0.8 : 0.5}"/>`);
    }
    const ySpan = y1 - y0;
    const yMajor = ySpan > 120 ? 10 : ySpan > 50 ? 5 : ySpan > 20 ? 2 : 1;
    const yMinor = yMajor / (yMajor === 10 ? 2 : yMajor === 5 ? 5 : yMajor === 2 ? 4 : 5);
    for (let v = Math.ceil(y0 / yMinor) * yMinor; v <= y1 + 1e-9; v += yMinor) {
      const major = Math.abs(v / yMajor - Math.round(v / yMajor)) < 1e-6;
      out.push(`<line x1="${m.l}" x2="${m.l + pw}" y1="${sy(v)}" y2="${sy(v)}" stroke="${major ? T.gridMajor : T.grid}" stroke-width="${major ? 0.8 : 0.4}"/>`);
      if (major) out.push(`<text x="${m.l - 4}" y="${sy(v) + fs * 0.35}" font-size="${fs}" text-anchor="end" fill="${T.text}">${+v.toFixed(1)}</text>`);
    }
    const xLab = span > 6 ? 1 : span > 2 ? 0.5 : 0.25;
    for (let a = Math.ceil(x0 / xLab - 1e-9) * xLab; a <= x1 + 1e-9; a += xLab) {
      const xPos = sx(a);
      if (xPos < m.l + 6 || xPos > m.l + pw - 6) continue;
      const lbl = Math.abs(a - Math.round(a)) < 1e-6 ? String(Math.round(a)) : Number(a.toFixed(2)).toString();
      out.push(`<text x="${xPos}" y="${m.t + ph + fs + 4}" font-size="${fs}" text-anchor="middle" fill="${T.text}">${lbl}</text>`);
    }
    out.push(`<text x="${m.l + pw / 2}" y="${H - 3}" font-size="${fs}" text-anchor="middle" fill="${T.text}" font-weight="600">Age (years)</text>`);
    const yTitle = { h: 'Height (cm)', w: 'Weight (kg)', b: 'BMI (kg/m²)', hw: 'Height (cm) · Weight (kg)' }[o.measure];
    out.push(`<text transform="translate(${fs + 1},${m.t + ph / 2}) rotate(-90)" font-size="${fs}" text-anchor="middle" fill="${T.text}" font-weight="600">${yTitle}</text>`);

    // ---- centile curves ----
    out.push(`<g clip-path="url(#clip-${o.id || 'c'})">`);
    const bundles = o.measure === 'hw' ? ['h', 'w'] : [o.measure];
    const labels = [];
    for (const meas of bundles) {
      (meas === 'b' ? G().BMI_P : G().IAP_P).forEach(p => {
        const pts = G().curve(meas, o.sex, G().normInv(p / 100), Math.max(x0, G().minAge(meas)), x1);
        if (!pts.length) return;
        const d = pts.map((q, k) => (k ? 'L' : 'M') + sx(q[0]).toFixed(1) + ' ' + sy(q[1]).toFixed(1)).join('');
        out.push(`<path d="${d}" fill="none" stroke="${p === 50 ? T.median : T.cent}" stroke-width="${p === 50 ? 1.6 : 0.9}" ${p === 3 || p === 97 ? 'stroke-dasharray="0"' : ''}/>`);
        const lp = pts[pts.length - 1];
        labels.push({ y: sy(lp[1]), t: String(p), c: p === 50 ? T.median : T.cent });
      });
      if (meas === 'h') {
        for (const [z, lbl, dash] of [[-2.25, '−2.25', '4 2'], [-2.5, '−2.5', '2 2'], [-3, '−3', '']]) {
          const pts = G().curve('h', o.sex, z, Math.max(x0, 0), x1);
          if (!pts.length) continue;
          const d = pts.map((q, k) => (k ? 'L' : 'M') + sx(q[0]).toFixed(1) + ' ' + sy(q[1]).toFixed(1)).join('');
          out.push(`<path d="${d}" fill="none" stroke="${T.sdRed}" stroke-width="${z === -3 ? 1.25 : 0.95}" ${dash ? `stroke-dasharray="${dash}"` : ''} opacity=".9"/>`);
          labels.push({ y: sy(pts[pts.length - 1][1]), t: lbl, c: T.sdRed, bold: z === -3 });
        }
      }
    }
    if (o.measure === 'b') {
      for (const [k, col, t] of [['ov', T.ov, '23'], ['ob', T.ob, '27']]) {
        const pts = G().cutoffCurve(o.sex, k, x0, x1);
        if (!pts.length) continue;
        out.push(`<path d="${pts.map((q, i) => (i ? 'L' : 'M') + sx(q[0]).toFixed(1) + ' ' + sy(q[1]).toFixed(1)).join('')}" fill="none" stroke="${col}" stroke-width="1.8"/>`);
        labels.push({ y: sy(pts[pts.length - 1][1]), t, c: col, bold: true });
      }
    }

    // ---- MPH / target range at 18 y ----
    if (o.mph && (o.measure === 'h' || o.measure === 'hw')) {
      const inView = 18 <= x1 + 1e-9;
      const xm = inView ? sx(18) - 6 : m.l + pw - 8;
      out.push(`<line x1="${xm}" x2="${xm}" y1="${sy(o.mph.high)}" y2="${sy(o.mph.low)}" stroke="${T.mph}" stroke-width="5" stroke-linecap="round" opacity=".35"/>`);
      out.push(`<path d="M${xm - 6} ${sy(o.mph.value)} l6 -5 l6 5 l-6 5z" fill="${T.mph}"/>`);
      if (!inView) out.push(`<text x="${xm - 9}" y="${sy(o.mph.value) + 3}" font-size="${fs}" text-anchor="end" fill="${T.mph}" font-weight="700">MPH ${f1(o.mph.value)} →</text>`);
    }

    // ---- patient points ----
    const series = o.measure === 'hw' ? ['h', 'w'] : [o.measure];
    for (const k of series) {
      const pts = (o.points || []).filter(p => p[k] != null && p.age >= G().minAge(k)).sort((a, b) => a.age - b.age);
      const col = T[k === 'b' ? 'h' : k];
      if (pts.length > 1) out.push(`<path d="${pts.map((p, i) => (i ? 'L' : 'M') + sx(p.age).toFixed(1) + ' ' + sy(p[k]).toFixed(1)).join('')}" fill="none" stroke="${col}" stroke-width="${o.mode === 'print' ? 1.6 : 2.2}" stroke-linejoin="round"/>`);
      pts.forEach((p, i) => {
        const r = o.mode === 'print' ? 2.8 : (i === pts.length - 1 ? 5 : 3.6);
        if (k === 'w') out.push(`<rect x="${sx(p.age) - r}" y="${sy(p[k]) - r}" width="${2 * r}" height="${2 * r}" fill="${p.corrected ? '#fff' : col}" stroke="${p.corrected ? col : '#fff'}" stroke-width="${p.corrected ? 1.8 : 1}"/>`);
        else out.push(`<circle cx="${sx(p.age)}" cy="${sy(p[k])}" r="${r}" fill="${p.corrected ? '#fff' : col}" stroke="${p.corrected ? col : '#fff'}" stroke-width="${p.corrected ? 1.8 : 1.2}"/>`);
        // bone age marker on height
        if (k === 'h' && p.ba != null && p.ba >= x0 && p.ba <= x1) {
          out.push(`<line x1="${sx(p.age)}" x2="${sx(p.ba)}" y1="${sy(p[k])}" y2="${sy(p[k])}" stroke="${T.ba}" stroke-width="1" stroke-dasharray="3 2"/>`);
          out.push(`<circle cx="${sx(p.ba)}" cy="${sy(p[k])}" r="${r}" fill="#fff" stroke="${T.ba}" stroke-width="1.6"/>`);
        }
      });
      if (o.showPointLabels && pts.length) {
        const pLabs = pts.filter(p => p.age >= x0 && p.age <= x1).map((p, idx, arr) => {
          const px = sx(p.age), py = sy(p[k]);
          const anchor = px < m.l + 44 ? 'start' : px > m.l + pw - 44 ? 'end' : 'middle';
          const dx = anchor === 'start' ? 6 : anchor === 'end' ? -6 : 0;
          const unit = k === 'h' ? 'cm' : k === 'w' ? 'kg' : '';
          return { x: px + dx, y: py - 10, anchor, txt: `${f1(p[k])}${unit ? ' ' + unit : ''}`, col, bold: idx === arr.length - 1 };
        });
        pLabs.sort((a, b) => a.y - b.y);
        const pGap = fs + 4;
        for (let i = 1; i < pLabs.length; i++) if (Math.abs(pLabs[i].x - pLabs[i - 1].x) < 42 && pLabs[i].y - pLabs[i - 1].y < pGap) pLabs[i].y = pLabs[i - 1].y + pGap;
        for (const pl of pLabs) {
          const ly = Math.max(m.t + fs + 2, Math.min(m.t + ph - 4, pl.y));
          out.push(`<text x="${pl.x.toFixed(1)}" y="${ly.toFixed(1)}" font-size="${fs - 0.5}" text-anchor="${pl.anchor}" fill="${pl.col}" font-weight="${pl.bold ? '800' : '700'}" stroke="${T.bg}" stroke-width="3" paint-order="stroke">${esc(pl.txt)}</text>`);
        }
      }
    }
    out.push('</g>');

    // ---- centile labels (de-overlapped vertically, never overflowing horizontally) ----
    labels.sort((a, b) => a.y - b.y);
    const gap = fs + 2;
    for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < gap) labels[i].y = labels[i - 1].y + gap;
    const maxY = m.t + ph - 4;
    if (labels.length && labels[labels.length - 1].y > maxY) {
      labels[labels.length - 1].y = maxY;
      for (let i = labels.length - 2; i >= 0; i--) if (labels[i + 1].y - labels[i].y < gap) labels[i].y = labels[i + 1].y - gap;
    }
    for (const L of labels) if (L.y > m.t + 2 && L.y < m.t + ph + 2)
      out.push(`<text x="${m.l + pw + 4}" y="${L.y + fs * 0.35}" font-size="${fs}" fill="${L.c}" ${L.bold ? 'font-weight="800"' : ''}>${esc(L.t)}</text>`);
    out.push(`<rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="none" stroke="${T.axis}" stroke-width="1"/>`);
    out.push('</svg>');
    return out.join('');
  }

  // Choose the view window. full=true -> standard IAP 0–18 view. zoom: 1 (patient), 2 (tight), 3 (close-up).
  function windowFor(measure, sex, points, full, mph, zoom) {
    const minA = G().minAge(measure === 'hw' ? 'h' : measure);
    let x0 = minA, x1 = 18;
    const zLvl = zoom || 1;
    const ages = (points || []).map(p => p.age).filter(a => a != null);
    if (!full && ages.length) {
      if (zLvl >= 2) {
        const lastAge = ages[ages.length - 1];
        const half = zLvl >= 3 ? 0.6 : 1.25;
        x0 = Math.max(minA, Math.floor((lastAge - half) * 4) / 4);
        x1 = Math.min(18, Math.ceil((lastAge + half) * 4) / 4);
        const minSpan = zLvl >= 3 ? 1 : 2;
        if (x1 - x0 < minSpan) { x0 = Math.max(minA, x0 - (minSpan - (x1 - x0)) / 2); x1 = Math.min(18, x0 + minSpan); }
      } else {
        x0 = Math.max(minA, Math.floor(Math.min(...ages) - 1));
        x1 = Math.min(18, Math.ceil(Math.max(...ages) + 2));
        if (x1 - x0 < 4) { const extra = 4 - (x1 - x0); x0 = Math.max(minA, x0 - Math.ceil(extra / 2)); x1 = Math.min(18, x0 + 4); }
      }
    }
    const meas = measure === 'hw' ? ['h', 'w'] : [measure];
    let lo = Infinity, hi = -Infinity;
    for (const k of meas) {
      const zs = k === 'h' ? [-3, G().Z_IAP[6]] : k === 'b' ? [G().Z_IAP[0]] : [G().Z_IAP[0], G().Z_IAP[6]];
      for (const z of zs) for (const [, v] of G().curve(k, sex, z, Math.max(x0, G().minAge(k)), x1)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      for (const p of points || []) if (p[k] != null && p.age >= x0 && p.age <= x1) { lo = Math.min(lo, p[k]); hi = Math.max(hi, p[k]); }
      if (k === 'b') for (const [, v] of G().cutoffCurve(sex, 'ob', x0, x1)) hi = Math.max(hi, v);
    }
    if (mph && meas.includes('h')) { hi = Math.max(hi, mph.high); }
    if (full && measure === 'hw') return { x0: 0, x1: 18, y0: 0, y1: sex === 'F' ? 180 : 190 };
    const pad = (hi - lo) * 0.06;
    const step = hi - lo > 60 ? 10 : hi - lo > 20 ? 5 : 1;
    return { x0, x1, y0: Math.max(0, Math.floor((lo - pad) / step) * step), y1: Math.ceil((hi + pad) / step) * step };
  }

  global.Charts = { render, windowFor };
})(window);
