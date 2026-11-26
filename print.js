// print.js — A4 OPD sheet (front + back) and A4 growth-chart pages
(function (global) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = () => global.Growth;
  const C = () => (global.ENDO_CONFIG || {}).clinic || {};
  const sd = z => z == null ? '' : (z >= 0 ? '+' : '−') + Math.abs(z).toFixed(2);
  const n1 = v => v == null ? '' : (Math.round(v * 10) / 10).toFixed(1);
  const dmy = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };

  function letterhead(small) {
    const c = C();
    return `<header class="lh${small ? ' lh-small' : ''}">
      <img class="lh-logo" src="logo.png?v=6" alt="Peds Endo Clinic">
      <div class="lh-doc"><div class="lh-name">${esc(c.doctorName)}</div>
        ${(c.qualifications || []).map(q => `<div>${esc(q)}</div>`).join('')}
        <div>Regd. No. : ${esc(c.regdNo)}</div></div>
    </header><div class="lh-rule"></div>`;
  }
  const fld = (label, val, cls = '') => `<div class="fld ${cls}"><span class="lab">${label}</span><span class="val">${esc(val)}</span></div>`;
  const wl = (label, val, lines = 1) => `<div class="wl"><span class="lab">${label}</span><span class="wline">${esc(val || '')}</span></div>` +
    Array.from({ length: lines - 1 }, () => '<div class="wl"><span class="wline full"></span></div>').join('');

  // ---------------- OPD sheet ----------------
  function opdSheet(patient, visit, allVisits) {
    const p = patient || {}, v = visit || {}, notes = v.notes || {}, hist = p.history || {}, birth = p.birth || {};
    const a = patient && visit ? G().analyse(p, v) : {};
    const mph = patient ? G().mph(p.sex, G().num(p.fatherHt), G().num(p.motherHt)) : null;
    const hv = patient && visit ? G().heightVelocity(p, allVisits || [], v) : null;
    const sex = patient ? p.sex : null;
    const sexTxt = sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : 'M / F';

    const front = `<section class="sheet opd">
      ${letterhead()}
      <div class="idblock">
        <div class="idl">
          ${fld('Name :', p.name)}
          <div class="row2">${fld('D.O.B. :', dmy(p.dob))}${fld(a.isCorrected ? 'Corr. Age :' : 'Age :', a.ageText && a.ageText !== '—' ? a.ageText : '')}</div>
          ${fld('Address :', p.address)}
          <div class="row2">${fld('Ref. By :', p.refBy)}${fld('Sex :', patient ? sexTxt : '')}</div>
          <div class="row2">${fld('Phone :', p.phone)}${fld('Patient ID :', p.code || '')}</div>
        </div>
        <div class="idr">
          ${fld('Date :', v.date ? dmy(v.date) : '', 'date')}
          ${fld('Wt. :', a.weight != null ? n1(a.weight) + ' kg' : '')}
          ${fld('Height :', a.height != null ? n1(a.height) + ' cm' : '')}
          <div class="row2 fm">${fld('F -', p.fatherHt ? n1(+p.fatherHt) : '')}${fld('M -', p.motherHt ? n1(+p.motherHt) : '')}</div>
          ${fld('BMI :', a.bmi != null ? n1(a.bmi) : '')}
        </div>
      </div>
      <table class="sdsbar"><tr>
        <th>Ht SDS</th><th>Wt SDS</th><th>BMI SDS</th><th>MPH</th><th>MPH SDS</th><th>Target range</th><th>Ht velocity</th></tr><tr>
        <td>${sd(a.hSds)}</td><td>${sd(a.wSds)}</td><td>${sd(a.bSds)}${a.bmiCat && a.bmiCat !== 'Normal' ? `<small>${esc(a.bmiCat)}</small>` : ''}</td>
        <td>${mph ? n1(mph.value) + ' cm' : ''}</td><td>${mph ? sd(mph.sds) : ''}</td>
        <td>${mph ? n1(mph.low) + '–' + n1(mph.high) : ''}</td><td>${hv ? n1(hv.cmPerYear) + ' cm/yr' : ''}</td></tr></table>

      <div class="sec"><div class="sec-h">Chief complaints</div>${wl('', notes.chief, 5)}</div>
      <div class="sec"><div class="sec-h">Birth history</div>
        <div class="grid2">${wl('Full term / Preterm :', birth.term + (birth.gestWeeks ? ` (${birth.gestWeeks} wk)` : ''))}${wl('AGA / SGA :', birth.aga)}${wl('Birth weight :', birth.weight ? birth.weight + ' kg' : '')}${wl('NICU admission (Y/N) :', birth.nicu)}</div></div>
      ${wl('<b>Development :</b>', hist.development)}
      ${wl('<b>Family history</b> (Diabetes / Thyroid / Malignancy / Puberty) :', hist.family)}
      ${wl('<b>Past history / Recurrent admissions :</b>', hist.past)}
      ${wl('<b>On examination :</b>', notes.exam)}
      <div class="exam">
        ${wl('Dysmorphism :', notes.dysmorphism)}
        ${wl('Eyes / Hearing / Spine :', notes.eyes)}
        ${wl('Goitre :', notes.goitre)}
        ${wl('Rickets / Clubbing :', notes.rickets)}
        ${sex !== 'M' ? wl("Turner's stigmata :", notes.turner) : ''}
        ${wl('Acanthosis / Lipomastia :', notes.acanthosis)}
        ${wl("Tanner's stage :", notes.tanner)}
        ${sex === 'M' ? wl('Testicular volume (R / L) · P · A :', notes.puberty) : sex === 'F' ? wl('B · P · A :', notes.puberty) : wl('B · P · A  /  Testicular volume · P · A :', notes.puberty)}
        ${wl('CVS / RS / PA / CNS :', notes.systemic)}
        ${wl('<b>Provisional diagnosis :</b>', notes.diagnosis, 2)}
      </div>
      <footer class="ft">
        <div class="nv"><div class="nv-h">Next Visit</div><div class="nv-b">${esc(dmy(notes.nextVisit))}</div></div>
        <div class="ft-sign">${esc(C().doctorName)}</div>
      </footer>
      <div class="ft-addr">${esc(C().address)} ${esc(C().phones)}</div>
    </section>`;

    const inv = notes.inv || {};
    const items = [['cbc', 'CBC'], ['sgpt', 'SGPT'], ['creat', 'Creatinine'], ['bsl', 'BSL'], ['lytes', 'Serum electrolytes'],
      ['ttg', 'tTG-IgA with Total IgA'], ['thyroid', 'Free T4 and TSH'], ['hormones', 'FSH / LH / Estradiol / Testosterone'], ['boneAge', 'Bone age']];
    const hist6 = (allVisits || []).filter(x => !visit || x.date <= visit.date).slice(-6);
    const back = `<section class="sheet opd back">
      <div class="back-top"><div><b>${esc(p.name || '')}</b>${patient ? ` · ${sexTxt} · DOB ${dmy(p.dob)}` : ''}</div><div>${v.date ? 'Date : ' + dmy(v.date) : 'Date :&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/'}</div></div>
      <h2 class="inv-h">Investigations</h2>
      <ol class="inv">${items.map(([k, l]) => `<li><div class="inv-l">${l}</div><div class="wline full">${esc(inv[k] || (k === 'boneAge' && v.boneAge ? v.boneAge + ' years' : ''))}</div></li>`).join('')}</ol>
      ${patient && hist6.length ? `<div class="sec-h">Growth record</div>
      <table class="grec"><tr><th>Date</th><th>Age</th><th>Height</th><th>Ht SDS</th><th>Weight</th><th>Wt SDS</th><th>BMI</th><th>BMI SDS</th></tr>
        ${hist6.map(x => { const r = G().analyse(p, x); return `<tr><td>${dmy(x.date)}</td><td>${r.ageText}</td><td>${n1(r.height)}</td><td>${sd(r.hSds)}</td><td>${n1(r.weight)}</td><td>${sd(r.wSds)}</td><td>${n1(r.bmi)}</td><td>${sd(r.bSds)}</td></tr>`; }).join('')}</table>` : ''}
      <div class="sec-h">Advice / Treatment</div>
      <div class="advice">${esc(notes.advice || '')}</div>
    </section>`;
    return front + back;
  }

  // ---------------- growth-chart pages ----------------
  function chartPages(patient, visits) {
    const p = patient;
    const mph = G().mph(p.sex, G().num(p.fatherHt), G().num(p.motherHt));
    const pts = visits.map(v => { const r = G().analyse(p, v); return { age: r.age, h: r.height, w: r.weight, b: r.bmi, ba: G().num(v.boneAge), corrected: r.isCorrected }; }).filter(q => q.age != null);
    const sexTxt = p.sex === 'F' ? 'Girls' : 'Boys';
    const strip = `<div class="cp-strip"><div><b>${esc(p.name)}</b> · ${p.sex === 'F' ? 'Female' : 'Male'} · DOB ${dmy(p.dob)}${p.birth && p.birth.term === 'Preterm' && p.birth.gestWeeks ? ` · Preterm ${esc(p.birth.gestWeeks)} wk` : ''}</div>
      <div>${mph ? `MPH ${n1(mph.value)} cm (SDS ${sd(mph.sds)}) · Target ${n1(mph.low)}–${n1(mph.high)} cm` : 'MPH: parents\' heights not entered'}</div></div>`;
    const legend = `<div class="cp-legend"><span><i class="lg-h"></i>Height</span><span><i class="lg-w"></i>Weight</span><span><i class="lg-ba"></i>Bone age</span>${mph ? '<span><i class="lg-mph"></i>Mid-parental height & target range</span>' : ''}<span><i class="lg-ob"></i>−2.25 / −2.5 / −3 SD</span>${pts.some(q => q.corrected) ? '<span><i class="lg-corr"></i>Preterm corrected (&lt;2 y)</span>' : ''}</div>`;
    const tbl = `<table class="grec"><tr><th>Date</th><th>Age</th><th>Height</th><th>Ht SDS</th><th>Weight</th><th>Wt SDS</th><th>BMI</th><th>BMI SDS</th></tr>${visits.slice(-8).map(x => { const r = G().analyse(p, x); return `<tr><td>${dmy(x.date)}</td><td>${r.ageText}${r.isCorrected ? ' (corr)' : ''}</td><td>${n1(r.height)}</td><td>${sd(r.hSds)}</td><td>${n1(r.weight)}</td><td>${sd(r.wSds)}</td><td>${n1(r.bmi)}</td><td>${sd(r.bSds)}</td></tr>`; }).join('')}</table>`;
    const hw = global.Charts.render({ id: 'phw', mode: 'print', measure: 'hw', sex: p.sex, points: pts, mph, x0: 0, x1: 18, y0: 0, y1: p.sex === 'F' ? 180 : 190, W: 700, H: 780 });
    const bw = global.Charts.windowFor('b', p.sex, pts, true);
    const bmi = global.Charts.render({ id: 'pb', mode: 'print', measure: 'b', sex: p.sex, points: pts, x0: 2, x1: 18, y0: Math.min(bw.y0, 11), y1: Math.max(bw.y1, 30), W: 700, H: 640 });
    return `<section class="sheet chartpage">${letterhead(true)}
        <h2 class="cp-title">${sexTxt} Height and Weight Chart · 0–18 years</h2>${strip}<div class="cp-chart">${hw}</div>${legend}
        <div class="cp-src">Centiles 3, 10, 25, 50, 75, 90, 97 · Extended −2.25, −2.5, −3 SD · WHO 2006 (0–5 y) and IAP 2015 (5–18 y)</div></section>
      <section class="sheet chartpage">${letterhead(true)}
        <h2 class="cp-title">${sexTxt} BMI Chart · 2–18 years</h2>${strip}<div class="cp-chart bmi">${bmi}</div>
        <div class="cp-legend"><span><i class="lg-h"></i>Patient BMI</span><span><i class="lg-ov"></i>Overweight (adult-equivalent 23)</span><span><i class="lg-ob"></i>Obese (adult-equivalent 27)</span></div>
        <div class="cp-src">Centiles 3, 5, 10, 25, 50 · WHO 2006 (2–5 y) and IAP 2015 (5–18 y)</div>${tbl}</section>`;
  }

  async function doPrint(html) {
    const root = document.getElementById('print-root');
    root.innerHTML = html;
    document.body.classList.add('printing');
    try { await document.fonts.ready; } catch (e) {}
    await Promise.all([...root.querySelectorAll('img')].map(img => img.complete ? 0 : new Promise(r => { img.onload = img.onerror = r; })));
    const done = () => { document.body.classList.remove('printing'); root.innerHTML = ''; global.removeEventListener('afterprint', done); };
    global.addEventListener('afterprint', done);
    setTimeout(() => global.print(), 60);
  }

  global.Print = { opdSheet, chartPages, doPrint };
})(window);
