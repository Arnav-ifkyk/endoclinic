// app.js — screens and interaction
(function () {
  'use strict';
  const $app = document.getElementById('app');
  const S = window.Store, G = window.Growth, CFG = window.ENDO_CONFIG || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1);
  const sd = z => z == null ? '—' : (z >= 0 ? '+' : '−') + Math.abs(z).toFixed(2);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const nice = s => { if (!s) return '—'; const [y, m, d] = s.split('-'); return `${+d} ${MON[+m - 1]} ${y}`; };
  const avatarSvg = sex => sex === 'F'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-label="Girl"><circle cx="12" cy="8.5" r="3.6"/><path d="M7.5 11.5c-.6-3.2 1.2-6.5 4.5-6.5s5.1 3.3 4.5 6.5"/><path d="M5 20.5c0-3.5 3.1-5.8 7-5.8s7 2.3 7 5.8"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-label="Boy"><circle cx="12" cy="8.5" r="3.8"/><path d="M8.8 6.2c1.4-1 4.8-1.2 6.4.4"/><path d="M5 20.5c0-3.5 3.1-5.8 7-5.8s7 2.3 7 5.8"/></svg>';

  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.25.4-1.51 1z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M5 3h14"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg>',
    sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    bar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
  };

  // ---------- ui state ----------
  const ui = {
    q: '', tab: {}, full: {}, zoom: {}, view: '', swWaiting: null,
    apDate: today(), apMonth: today().slice(0, 7), apView: 'day',
    bookTab: 'existing', bookPid: '', bookPickQ: '', prefillPatient: null,
  };
  let toastT;
  function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
  function modal(title, text, buttons) {
    return new Promise(res => {
      const m = document.createElement('div'); m.className = 'modal';
      m.innerHTML = `<div class="sheet-in"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}<div class="col">${buttons.map((b, i) => `<button class="${b.cls || 'btn'}" data-i="${i}">${b.html || esc(b.label)}</button>`).join('')}</div></div>`;
      m.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b || e.target === m) { m.remove(); res(b ? buttons[+b.dataset.i].value : null); } });
      document.body.appendChild(m);
    });
  }
  const go = h => { location.hash = h; };

  // ---------- helpers ----------
  function visitsOf(pid) { return S.visitsOf(pid); }
  function lastVisit(pid) { const v = visitsOf(pid); return v[v.length - 1]; }
  function points(p) { return visitsOf(p.id).map(v => { const r = G.analyse(p, v); return { age: r.age, h: r.height, w: r.weight, b: r.bmi, ba: G.num(v.boneAge), corrected: r.isCorrected }; }).filter(x => x.age != null); }
  function applyTextSize() {
    const sz = (S.state.settings && S.state.settings.textSize) || 'normal';
    if (sz === 'normal') delete document.documentElement.dataset.size;
    else document.documentElement.dataset.size = sz;
  }
  function updateBanner() {
    return ui.swWaiting ? `<button type="button" class="update-bar" data-act="applyUpdate">New version available · Tap to update<span class="pill">Update</span></button>` : '';
  }
  function bottomNav(active) {
    const tabs = [['today', 'Today', I.home, '/'], ['appointments', 'Appointments', I.cal, '/appointments'], ['patients', 'Patients', I.users, '/patients'], ['settings', 'Settings', I.gear, '/settings']];
    return `<nav class="bnav" aria-label="Primary"><div class="bnav-in">${tabs.map(([k, lbl, ic, hash]) =>
      `<button type="button" class="${active === k ? 'on' : ''}" data-act="nav" data-to="${hash}" ${active === k ? 'aria-current="page"' : ''}>${ic}<span>${lbl}</span></button>`
    ).join('')}</div></nav>`;
  }
  function syncPill() {
    const st = S.state;
    if (!S.cloudConfigured) return `<div class="syncpill"><div class="syncrow"><span class="dot off"></span>Demo mode · saved on this phone only</div></div>`;
    if (!navigator.onLine) return `<div class="syncpill"><div class="syncrow"><span class="dot wait"></span>Offline · ${st.pending} waiting to upload</div></div>`;
    if (st.error) return `<div class="syncpill" data-act="sync"><div class="syncrow"><span class="dot bad"></span>Not saved online yet · tap to retry</div><div class="syncerr">${esc(st.error)}</div></div>`;
    if (st.syncing) return `<div class="syncpill"><div class="syncrow"><span class="pebble-ring sync-ring" aria-hidden="true"></span>Saving online…</div></div>`;
    if (st.pending) return `<div class="syncpill"><div class="syncrow"><span class="dot wait"></span>${st.pending} waiting to save online…</div></div>`;
    return `<div class="syncpill"><div class="syncrow"><span class="dot"></span>All records safely saved online</div></div>`;
  }
  function dateTriple(name, iso, withToday) {
    const [y, m, d] = (iso || '').split('-');
    return `<div class="dob field" data-date="${name}">
      <input inputmode="numeric" maxlength="2" placeholder="DD" name="${name}_d" value="${esc(d ? +d : '')}" aria-label="Day">
      <input inputmode="numeric" maxlength="2" placeholder="MM" name="${name}_m" value="${esc(m ? +m : '')}" aria-label="Month">
      <input inputmode="numeric" maxlength="4" placeholder="YYYY" name="${name}_y" value="${esc(y || '')}" aria-label="Year">
      ${withToday ? `<button type="button" class="today" data-act="today" data-for="${name}">Today</button>` : '<span></span>'}</div>`;
  }
  function readDate(form, name) {
    const d = +form[name + '_d'].value, m = +form[name + '_m'].value, y = +form[name + '_y'].value;
    if (!d || !m || !y || y < 1900 || m > 12 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCDate() !== d) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const val = (form, n) => (form[n] && form[n].value || '').trim();

  // ======================================================
  //  VIEWS
  // ======================================================
  function viewLogin() {
    return `<div class="login">
      <div class="pebble-ring logo-ring"><img class="logo" src="logo.png?v=6" alt="Peds Endo Clinic"></div>
      <h1>${esc((CFG.clinic || {}).doctorName || 'Dr. Vijay Shripad Dhawle')}</h1>
      <p class="sub">Pediatric Endocrinology · Latur</p>
      <form class="form" id="loginForm" autocomplete="on">
        <div class="field"><label>Email</label><input name="email" type="email" autocomplete="username" required></div>
        <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required></div>
        <div class="err" id="loginErr"></div>
        <button class="cta" type="submit">Sign in</button>
      </form>
      <p class="fineprint" style="text-align:center">You stay signed in on this phone after the first time</p>
    </div>`;
  }

  function renderCalendar(monthYm, selectedIso, appts, followUps) {
    const [yr, mo] = monthYm.split('-').map(Number);
    const first = new Date(Date.UTC(yr, mo - 1, 1));
    const startDow = (first.getUTCDay() + 6) % 7; // Monday = 0
    const start = new Date(Date.UTC(yr, mo - 1, 1 - startDow));
    const t = today();
    const apDates = new Set(appts.filter(a => a.status !== 'done').map(a => a.date));
    const fuDates = new Set(followUps.map(f => f.date));
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const inMonth = d.getUTCMonth() === mo - 1;
      const cls = ['cal-day', inMonth ? '' : 'out', iso === t ? 'today' : '', iso === selectedIso ? 'on' : ''].filter(Boolean).join(' ');
      const dots = `${apDates.has(iso) ? '<i class="ap"></i>' : ''}${fuDates.has(iso) ? '<i class="fu"></i>' : ''}`;
      cells.push(`<button type="button" class="${cls}" data-act="calDay" data-d="${iso}"><span>${d.getUTCDate()}</span><span class="cal-dots">${dots}</span></button>`);
    }
    const title = `${MON[mo - 1]} ${yr}`;
    return `<div class="cal">
      <div class="cal-head"><div class="cal-title">${title}</div><div class="cal-nav">
        <button type="button" class="cal-btn" data-act="calMonth" data-dir="-1" aria-label="Previous month">‹</button>
        <button type="button" class="cal-btn" data-act="calToday">Today</button>
        <button type="button" class="cal-btn" data-act="calMonth" data-dir="1" aria-label="Next month">›</button>
      </div></div>
      <div class="cal-dow"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      <div class="cal-grid">${cells.join('')}</div>
    </div>`;
  }

  function viewAppointments() {
    const t = today();
    const appts = S.appointments();
    const fus = followUpsDue();
    const sel = ui.apDate || t;
    const shownAppts = ui.apView === 'upcoming'
      ? appts.filter(a => a.date >= t && a.status !== 'done')
      : appts.filter(a => a.date === sel);
    const shownFus = ui.apView === 'day' ? fus.filter(f => f.date === sel) : [];
    return `<div class="top"><span style="width:56px"></span><div class="ttl">Appointments</div><span style="width:56px"></span></div>
      ${updateBanner()}
      ${renderCalendar(ui.apMonth || sel.slice(0, 7), sel, appts, fus)}
      <div style="margin-top:12px"><button class="cta" data-act="bookNew"><span class="plus">+</span>Book appointment</button></div>
      <div class="seg sm" style="margin-top:12px">
        <button type="button" class="${ui.apView === 'day' ? 'on' : ''}" data-act="apView" data-v="day">${nice(sel)}</button>
        <button type="button" class="${ui.apView === 'upcoming' ? 'on' : ''}" data-act="apView" data-v="upcoming">All upcoming</button>
      </div>
      <div class="sec-title">${ui.apView === 'upcoming' ? 'Upcoming appointments' : 'Schedule for ' + nice(sel)}<small>${shownAppts.length}</small></div>
      ${shownAppts.length ? `<div style="display:grid;gap:8px">${shownAppts.map(a => {
        const p = a.patientId ? S.state.patients.get(a.patientId) : null;
        const nm = p ? p.name : a.name;
        const phone = (p && p.phone) || a.phone || '';
        const isDone = a.status === 'done';
        return `<div class="appt-card"${isDone ? ' style="opacity:.65"' : ''}>
          <div class="appt-top"><div class="appt-time">${esc(a.time || 'Anytime')}</div>
            <div class="grow"><div class="nm" style="font-weight:600">${esc(nm)}</div>
              <div class="sub" style="font-size:14px;color:var(--ink2)">${ui.apView === 'upcoming' ? nice(a.date) + ' · ' : ''}${a.kind === 'new' ? 'New patient' : 'Existing'}${phone ? ' · ' + esc(phone) : ''}${a.reason ? ' · ' + esc(a.reason) : ''}</div></div>
            <span class="chip ${a.kind === 'new' ? 'gold' : ''}">${isDone ? 'Done' : a.kind === 'new' ? 'New' : 'Existing'}</span></div>
          <div class="appt-acts">
            ${p ? `<button type="button" class="pri" data-act="open" data-id="${p.id}">Open patient</button><button type="button" data-act="newVisit" data-id="${p.id}">Add visit</button>`
              : `<button type="button" class="pri" data-act="registerAppt" data-a="${a.id}">Register &amp; visit</button>`}
            ${!isDone ? `<button type="button" class="done" data-act="doneAppt" data-a="${a.id}">Mark done</button>` : ''}
            <button type="button" class="del" data-act="delAppt" data-a="${a.id}">Cancel</button>
          </div></div>`;
      }).join('')}</div>` : `<div class="empty"><div class="big">No appointments</div></div>`}
      ${shownFus.length ? `<div class="sec-title">Follow-ups due<small>${shownFus.length}</small></div><ul class="plist">${shownFus.map(({ p, lv, status, label }) => patientRow(p, lv, `<span class="fu-badge ${status}">${esc(label)}</span>`)).join('')}</ul>` : ''}
      ${syncPill()}${bottomNav('appointments')}`;
  }

  function viewBookAppointment(prePid) {
    if (prePid) { ui.bookTab = 'existing'; ui.bookPid = prePid; }
    const isNew = ui.bookTab === 'new';
    const q = ui.bookPickQ.trim().toLowerCase();
    const pts = S.patients().filter(p => !q || (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q) || (p.code || '').toLowerCase().includes(q)).slice(0, 30);
    const selP = ui.bookPid ? S.state.patients.get(ui.bookPid) : null;
    const times = ['10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];
    return `<div class="top"><button class="iconbtn" data-act="nav" data-to="/appointments" aria-label="Back">${I.back}</button><div class="ttl">Book appointment</div><span style="width:56px"></span></div>
      <div class="seg" style="margin-top:8px">
        <button type="button" class="${!isNew ? 'on' : ''}" data-act="bookTab" data-v="existing">Existing patient</button>
        <button type="button" class="${isNew ? 'on' : ''}" data-act="bookTab" data-v="new">New patient</button>
      </div>
      <form class="form" id="apForm" autocomplete="off" style="margin-top:14px">
        ${!isNew ? `<div>
          <div class="search" style="margin:0">${I.search}<input id="apPickQ" type="search" placeholder="Search existing patient" value="${esc(ui.bookPickQ)}"></div>
          ${selP ? `<div class="pick-item on" style="margin-top:8px"><div><b>${esc(selP.name)}</b><div style="font-size:13px;color:var(--ink2)">${esc(selP.code || '')} ${selP.phone ? '· ' + esc(selP.phone) : ''}</div></div><span class="chip ok">Selected</span></div>` : ''}
          <div class="pick-list">${pts.map(p => `<button type="button" class="pick-item ${ui.bookPid === p.id ? 'on' : ''}" data-act="pickPatient" data-id="${p.id}">
            <span><b>${esc(p.name)}</b><small style="display:block;color:var(--muted)">${p.sex === 'F' ? 'Girl' : 'Boy'}${p.phone ? ' · ' + esc(p.phone) : ''}</small></span>
            <span class="chip">${esc(p.code || '')}</span></button>`).join('')}</div>
          <input type="hidden" name="ap_pid" value="${esc(ui.bookPid)}">
        </div>` : `
          <div class="field"><label>Child’s full name</label><input name="ap_name" autocapitalize="words" required></div>
          <div><span class="flabel">Boy or girl</span><div class="toggle" data-sex>
            <button type="button" class="M" data-act="apSex" data-v="M"><span class="pebble M"><span>♂</span></span>Boy</button>
            <button type="button" class="F" data-act="apSex" data-v="F"><span class="pebble F"><span>♀</span></span>Girl</button></div>
            <input type="hidden" name="ap_sex" value=""></div>
          <div class="field"><label>Phone</label><input name="ap_phone" inputmode="tel"></div>`}
        <div><span class="flabel">Appointment date</span>${dateTriple('ap_date', ui.apDate || today(), true)}</div>
        <div class="field"><label>Time (optional)</label>
          <div class="choices" style="margin-bottom:8px">${times.map(tm => `<button type="button" data-act="apTime" data-v="${tm}">${tm}</button>`).join('')}</div>
          <input name="ap_time" type="time"></div>
        <div class="field"><label>Reason / note (optional)</label><input name="ap_reason" placeholder="e.g. Follow-up, growth check"></div>
        <div class="err" id="apErr"></div>
      </form>
      <div class="stickybar"><div class="inner"><button class="cta gold" data-act="saveAppt">Save appointment</button></div></div>`;
  }

  function patientRow(p, lv, extraBadge) {
    const a = lv ? G.analyse(p, lv) : null;
    const age = G.ageText(G.ageYears(p.dob, today()));
    const badge = extraBadge || (a && a.hSds != null ? `<span class="chip ${a.hSds < -2 ? 'warn' : ''}">Ht ${sd(a.hSds)}</span>` : '');
    return `<li class="pcard" data-act="open" data-id="${p.id}"><div class="pebble ${p.sex}">${avatarSvg(p.sex)}</div>
      <div class="grow"><div class="nm">${esc(p.name)}</div><div class="sub">${age} · ${p.sex === 'F' ? 'Girl' : 'Boy'} · ${lv ? 'Last seen ' + nice(lv.date) : 'No visits yet'}</div></div>${badge}</li>`;
  }

  function followUpsDue() {
    const t = today();
    const dt = new Date(t + 'T00:00:00Z');
    dt.setUTCDate(dt.getUTCDate() + 7);
    const weekEnd = dt.toISOString().slice(0, 10);
    const due = [];
    for (const p of S.patients()) {
      const vs = visitsOf(p.id);
      let latestFu = null;
      for (let i = vs.length - 1; i >= 0; i--) {
        const nv = vs[i].notes && vs[i].notes.nextVisit;
        if (nv) { latestFu = { date: nv, fromVisit: vs[i] }; break; }
      }
      if (!latestFu) continue;
      if (vs.some(v => v.date >= latestFu.date && v.id !== latestFu.fromVisit.id)) continue;
      if (latestFu.date > weekEnd) continue;
      const status = latestFu.date < t ? 'over' : latestFu.date === t ? 'due' : 'week';
      const label = status === 'over' ? 'Overdue · ' + nice(latestFu.date) : status === 'due' ? 'Due today' : nice(latestFu.date);
      due.push({ p, lv: vs[vs.length - 1], date: latestFu.date, status, label });
    }
    const order = { due: 0, over: 1, week: 2 };
    due.sort((a, b) => (order[a.status] - order[b.status]) || a.date.localeCompare(b.date));
    return due;
  }

  function filteredPatients() {
    const all = S.patients().map(p => ({ p, lv: lastVisit(p.id) }));
    all.sort((a, b) => ((b.lv && b.lv.date) || b.p.createdAt || '').localeCompare((a.lv && a.lv.date) || a.p.createdAt || ''));
    const q = ui.q.trim().toLowerCase();
    const list = q ? all.filter(({ p }) => (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q) || (p.code || '').toLowerCase().includes(q)) : all;
    return { all, list, q };
  }

  function viewToday() {
    const { all, list, q } = filteredPatients();
    const t = today();
    const seenToday = [];
    for (const { p, lv } of all) {
      const vs = visitsOf(p.id);
      const tv = vs.find(v => v.date === t);
      if (tv) seenToday.push({ p, lv: tv });
    }
    const due = followUpsDue();
    const d = new Date();
    const dateLabel = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<div class="top"><img class="logo" src="logo.png?v=6" alt="Peds Endo Clinic"><button class="iconbtn" data-act="settings" aria-label="Settings">${I.gear}</button></div>
      ${updateBanner()}
      <section class="hello">
        <div class="date">${dateLabel} · ${esc((CFG.clinic || {}).greetingName || 'Dr. Dhawle')}</div>
        <h1>Today’s clinic</h1>
        <div class="stats">${seenToday.length} seen today · ${due.length} follow-up${due.length === 1 ? '' : 's'} due · ${all.length} total</div>
        ${S.cloudConfigured ? '' : '<div class="demo">Demo mode: records are kept on this phone only. Connect Supabase in config.js before using with patients.</div>'}
      </section>
      <div class="search">${I.search}<input id="q" type="search" placeholder="Search name, phone or ID" value="${esc(ui.q)}" autocomplete="off"></div>
      <button class="cta" data-act="newPatient"><span class="plus">+</span>New patient</button>
      ${q ? `<div class="sec-title">Search results<small>${list.length}</small></div>
        ${list.length ? `<ul class="plist">${list.slice(0, 60).map(({ p, lv }) => patientRow(p, lv)).join('')}</ul>`
          : `<div class="empty"><div class="big">No match</div>Try part of the name or phone number</div>`}`
      : `<div class="sec-title">Today’s patients<small>${seenToday.length}</small></div>
        ${seenToday.length ? `<ul class="plist">${seenToday.map(({ p, lv }) => patientRow(p, lv)).join('')}</ul>`
          : `<div class="empty"><div class="big">No visits today yet</div></div>`}
        <div class="sec-title">Follow-ups due<small>${due.length}</small></div>
        ${due.length ? `<ul class="plist">${due.map(({ p, lv, status, label }) => patientRow(p, lv, `<span class="fu-badge ${status}">${esc(label)}</span>`)).join('')}</ul>`
          : `<div class="empty"><div class="big">No follow-ups due</div></div>`}`}
      ${syncPill()}${bottomNav('today')}`;
  }

  function viewPatients() {
    const { all, list, q } = filteredPatients();
    const shown = q ? list : list.slice(0, 100);
    return `<div class="top"><span style="width:56px"></span><div class="ttl">Patients</div><span style="width:56px"></span></div>
      ${updateBanner()}
      <div class="search" style="margin-top:8px">${I.search}<input id="q" type="search" placeholder="Search name, phone or ID" value="${esc(ui.q)}" autocomplete="off"></div>
      <button class="cta" data-act="newPatient"><span class="plus">+</span>New patient</button>
      <div class="sec-title">${q ? 'Search results' : 'All patients'}<small>${shown.length}${!q && all.length > 100 ? ' of ' + all.length : ''}</small></div>
      ${shown.length ? `<ul class="plist">${shown.map(({ p, lv }) => patientRow(p, lv)).join('')}</ul>`
        : `<div class="empty"><div class="big">${q ? 'No match' : 'No patients yet'}</div>${q ? 'Try part of the name or phone number' : 'Tap “New patient” to add the first record'}</div>`}
      ${syncPill()}${bottomNav('patients')}`;
  }

  function viewReports() {
    const pts = S.patients();
    const vs = [...S.state.visits.values()].filter(v => !v.deleted);
    return `<div class="top"><span style="width:56px"></span><div class="ttl">Reports</div><span style="width:56px"></span></div>
      ${updateBanner()}
      <div class="tiles" style="margin-top:12px">
        ${tile('Total patients', pts.length, '', 'Active register')}
        ${tile('Total visits', vs.length, '', 'All recorded visits')}
      </div>
      <div style="margin-top:16px"><button class="btn" style="width:100%" data-act="exportCsv">${I.down}Export all visits to Excel (CSV)</button></div>
      ${syncPill()}${bottomNav('reports')}`;
  }

  function tile(k, v, unit, s, cls = '', accent = '') {
    return `<div class="tile ${cls}"${accent ? ` data-accent="${accent}"` : ''}><div class="k">${k}</div><div class="v">${v}${unit ? ` <small>${unit}</small>` : ''}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
  }

  function viewPatient(id) {
    const p = S.state.patients.get(id);
    if (!p || p.deleted) return `<div class="top"><button class="iconbtn" data-act="home">${I.back}</button></div><div class="empty"><div class="big">Patient not found</div></div>`;
    const vs = visitsOf(id), lv = vs[vs.length - 1];
    const a = lv ? G.analyse(p, lv) : null;
    const mph = G.mph(p.sex, G.num(p.fatherHt), G.num(p.motherHt));
    const hv = lv ? G.heightVelocity(p, vs, lv) : null;
    const ageNow = G.ageText(G.ageYears(p.dob, today()));
    const tab = ui.tab[id] || 'h', zLvl = ui.full[id] ? 0 : (ui.zoom[id] || 1), full = zLvl === 0;
    const pts = points(p);
    const renderChart = (W, H, cid) => {
      const w = window.Charts.windowFor(tab, p.sex, pts, full, tab === 'h' ? mph : null, zLvl);
      return window.Charts.render({ id: cid, mode: 'screen', measure: tab, sex: p.sex, points: pts, mph: tab === 'h' ? mph : null, showPointLabels: zLvl >= 2, ...w, W, H });
    };
    const chart = renderChart(360, 330, 'scr');
    const zsc = z => z == null ? '' : `SDS ${sd(z)} <span class="c">· ${G.centileText(z)}</span>`;
    const diff = a && a.hSds != null && mph ? a.hSds - mph.sds : null;
    const flags = lv ? G.clinicalFlags(p, vs, lv, { hvThreshold: (S.state.settings && S.state.settings.hvThreshold) || 4 }) : [];
    const corrNote = a && a.isCorrected ? ` · Corrected ${a.ageText} (Chrono ${a.chronoAgeText})` : '';
    return `<div class="top"><button class="iconbtn" data-act="home" aria-label="Back">${I.back}</button><div class="ttl"></div><button class="iconbtn" data-act="editPatient" data-id="${id}" aria-label="Edit patient">${I.edit}</button></div>
      <div class="hero"><div class="hero-head"><div class="pebble-ring"><div class="pebble ${p.sex}">${avatarSvg(p.sex)}</div></div><div><div class="nm">${esc(p.name)}</div>
        <div class="meta">${ageNow}</div></div></div></div>
      <div style="margin-top:12px"><button class="cta gold" data-act="newVisit" data-id="${id}"><span class="plus">+</span>Add today’s visit</button></div>
      <div class="btnrow"><button class="btn" data-act="printOpd" data-id="${id}">${I.print}OPD sheet</button><button class="btn" data-act="printCharts" data-id="${id}" ${vs.length ? '' : 'disabled style="opacity:.5"'}>${I.chart}Growth charts</button></div>
      <div style="margin-top:8px"><button class="btn" style="width:100%" data-act="bookFor" data-id="${id}">${I.cal}Book appointment</button></div>
      ${flags.length ? `<div class="flags">${flags.map(f => `<span class="flag ${f.level}">${esc(f.text)}</span>`).join('')}</div>` : ''}

      <div class="sec-title">Latest visit<small>${lv ? nice(lv.date) + ' · ' + a.ageText + (a.isCorrected ? ' (corr)' : '') : ''}</small></div>
      ${lv ? `<div class="tiles">
        ${tile('Height', n1(a.height), 'cm', zsc(a.hSds), a.hSds != null && a.hSds < -2 ? 'alert' : '', 'h')}
        ${tile('Weight', n1(a.weight), 'kg', zsc(a.wSds), '', 'w')}
        ${tile('BMI', n1(a.bmi), '', a.bSds != null ? `SDS ${sd(a.bSds)}${a.bmiCat ? ` <span class="c">· ${a.bmiCat}</span>` : ''}` : (a.age != null && a.age < 2 ? '<span class="c">From 2 years</span>' : a.preTermCga ? '<span class="c">Pre-term (&lt;40 wk CGA)</span>' : ''), a.bmiCat === 'Overweight' || a.bmiCat === 'Obese' ? 'alert' : '', 'b')}
        ${tile('Height velocity', hv ? n1(hv.cmPerYear) : '—', hv ? 'cm/yr' : '', hv ? `<span class="c">Over ${n1(hv.overYears * 12).replace('.0', '')} months</span>` : '<span class="c">Needs 2 visits ≥4 months apart</span>', '', 'hv')}
        ${mph ? `<div class="tile" data-accent="mph" style="grid-column:1/-1"><div class="k">Mid-parental height${corrNote ? ` <span class="c">${esc(corrNote)}</span>` : ''}</div>
          <div class="v">${n1(mph.value)} <small>cm · SDS ${sd(mph.sds)} · ${G.centileText(mph.sds)}</small></div>
          <div class="s">${diff != null ? `Ht SDS − MPH SDS = ${sd(diff)}` : ''} <span class="c">· F ${n1(+p.fatherHt)} · M ${n1(+p.motherHt)}</span></div></div>` : ''}
      </div>` : `<div class="empty"><div class="big">No visits yet</div>Add the first visit to see SDS and charts</div>`}

      <div class="sec-title">Growth chart<small>IAP 2015 · WHO 2006</small></div>
      <div class="card">
        <div class="seg">${[['h', 'Height'], ['w', 'Weight'], ['b', 'BMI']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-id="${id}" data-k="${k}">${l}</button>`).join('')}</div>
        <div class="chartbox">${chart}</div>
        <div class="charttools"><div class="legend"><span><i style="background:${tab === 'w' ? '#1f7a74' : '#c94b24'}"></i>${esc(p.name.split(' ')[0])}</span>${tab === 'h' ? '<span><i style="background:#c81e1e"></i>−2.25/−2.5/−3 SD</span>' : ''}${tab === 'h' && mph ? '<span><i style="background:#b07a0e;border-radius:2px;transform:rotate(45deg)"></i>MPH</span>' : ''}${tab === 'h' && vs.some(v => v.boneAge) ? '<span><i style="border:2px solid #2f3c9e;background:#fff"></i>Bone age</span>' : ''}${pts.some(q => q.corrected) ? '<span><i style="border:2px solid #c94b24;background:#fff"></i>Corrected (&lt;2 y)</span>' : ''}${tab === 'b' ? '<span><i style="background:#e88a1a"></i>23</span><span><i style="background:#d1342f"></i>27</span>' : ''}</div>
          <div class="zoombar">
            <button class="zbtn" data-act="zoomOut" data-id="${id}" ${zLvl <= 0 ? 'disabled' : ''} aria-label="Zoom out">−</button>
            <button class="zbtn ${zLvl >= 2 ? 'on' : ''}" data-act="zoomIn" data-id="${id}" ${zLvl >= 3 ? 'disabled' : ''} aria-label="Zoom in">+ ${zLvl >= 2 ? zLvl + '×' : 'Zoom'}</button>
            <button class="zbtn" data-act="zoom" data-id="${id}">${full ? 'Patient' : '0–18 y'}</button>
            <button class="zbtn" data-act="zoomModal" data-id="${id}" aria-label="Expand chart">⤢</button>
          </div></div>
      </div>

      <div class="sec-title">All visits<small>${vs.length}</small></div>
      ${vs.length ? `<div class="card"><ul class="vlist">${vs.slice().reverse().map(v => {
        const r = G.analyse(p, v); const [y, m, d] = v.date.split('-');
        return `<li class="vrow" data-act="editVisit" data-id="${id}" data-v="${v.id}"><div class="d">${+d} ${MON[+m - 1]}<small>${y}</small></div>
          <div class="m"><div class="metrics"><span><b>${n1(r.height)}</b> cm</span><span><b>${n1(r.weight)}</b> kg</span><span>BMI <b>${n1(r.bmi)}</b></span></div><div class="sub"><span>${r.ageText}</span><span>Ht SDS ${sd(r.hSds)}</span></div></div><div style="color:var(--ink2);font-size:20px;font-weight:600">›</div></li>`;
      }).join('')}</ul></div>` : ''}
      ${syncPill()}`;
  }

  function choice(name, options, cur) {
    return `<div class="choices" data-choice="${name}">${options.map(o => `<button type="button" class="${cur === o ? 'on' : ''}" data-act="choose" data-v="${esc(o)}">${esc(o)}</button>`).join('')}<input type="hidden" name="${name}" value="${esc(cur || '')}"></div>`;
  }

  function viewPatientForm(id) {
    const pre = !id ? ui.prefillPatient : null;
    const p = id ? S.state.patients.get(id) : { sex: (pre && pre.sex) || '', name: (pre && pre.name) || '', phone: (pre && pre.phone) || '' };
    const b = p.birth || {}, h = p.history || {};
    return `<div class="top"><button class="iconbtn" data-act="${id ? 'open' : 'home'}" data-id="${id || ''}" aria-label="Back">${I.back}</button><div class="ttl">${id ? 'Edit patient' : 'New patient'}</div><span style="width:52px"></span></div>
    <form class="form" id="pForm" autocomplete="off">
      <div class="field"><label>Child’s full name</label><input name="name" value="${esc(p.name)}" autocapitalize="words" required></div>
      <div><span class="flabel">Boy or girl</span><div class="toggle" data-sex>
        <button type="button" class="M ${p.sex === 'M' ? 'on M' : ''}" data-act="sex" data-v="M"><span class="pebble M"><span>♂</span></span>Boy</button>
        <button type="button" class="F ${p.sex === 'F' ? 'on F' : ''}" data-act="sex" data-v="F"><span class="pebble F"><span>♀</span></span>Girl</button></div>
        <input type="hidden" name="sex" value="${esc(p.sex)}"></div>
      <div><span class="flabel">Date of birth</span>${dateTriple('dob', p.dob, false)}</div>
      <div class="two"><div class="field"><label>Father’s height</label><div class="unit"><input name="fatherHt" inputmode="decimal" value="${esc(p.fatherHt)}"><span>cm</span></div></div>
        <div class="field"><label>Mother’s height</label><div class="unit"><input name="motherHt" inputmode="decimal" value="${esc(p.motherHt)}"><span>cm</span></div></div></div>
      <div class="live" id="mphLive"></div>
      <div class="field"><label>Phone</label><input name="phone" inputmode="tel" value="${esc(p.phone)}"></div>
      <div class="field"><label>Address</label><input name="address" value="${esc(p.address)}"></div>
      <div class="field"><label>Referred by</label><input name="refBy" value="${esc(p.refBy)}"></div>
      <details class="more"><summary>Birth history <span class="c"></span></summary><div class="form">
        <div><span class="flabel">Full term / Preterm</span>${choice('b_term', ['Full term', 'Preterm'], b.term)}</div>
        <div class="field"><label>Gestational age (if preterm)</label><div class="unit"><input name="b_gestWeeks" inputmode="numeric" value="${esc(b.gestWeeks)}" placeholder="e.g. 32"><span>wk</span></div></div>
        <div><span class="flabel">AGA / SGA</span>${choice('b_aga', ['AGA', 'SGA', 'LGA'], b.aga)}</div>
        <div class="field"><label>Birth weight</label><div class="unit"><input name="b_weight" inputmode="decimal" value="${esc(b.weight)}"><span>kg</span></div></div>
        <div><span class="flabel">NICU admission</span>${choice('b_nicu', ['Yes', 'No'], b.nicu)}</div></div></details>
      <details class="more"><summary>Development & family / past history</summary><div class="form">
        <div class="field"><label>Development</label><input name="h_development" value="${esc(h.development)}"></div>
        <div class="field"><label>Family history (diabetes, thyroid, malignancy, puberty)</label><textarea name="h_family">${esc(h.family)}</textarea></div>
        <div class="field"><label>Past history / recurrent admissions</label><textarea name="h_past">${esc(h.past)}</textarea></div></div></details>
      <div class="err" id="pErr"></div>
      ${id ? `<button type="button" class="btn danger" data-act="deletePatient" data-id="${id}">Delete this patient</button>` : ''}
    </form>
    <div class="stickybar"><div class="inner"><button class="cta" data-act="savePatient" data-id="${id || ''}">${id ? 'Save changes' : 'Save & add first visit'}</button></div></div>`;
  }

  const NOTE_FIELDS = [
    ['chief', 'Chief complaints', 'area'], ['exam', 'On examination'], ['dysmorphism', 'Dysmorphism'], ['eyes', 'Eyes / hearing / spine'],
    ['goitre', 'Goitre'], ['rickets', 'Rickets / clubbing'], ['turner', "Turner's stigmata", '', 'F'], ['acanthosis', 'Acanthosis / lipomastia'],
    ['tanner', "Tanner's stage"], ['puberty', 'B · P · A  /  Testicular volume · P · A'], ['systemic', 'CVS / RS / PA / CNS'], ['diagnosis', 'Provisional diagnosis', 'area'],
  ];
  const INV_FIELDS = [['cbc', 'CBC'], ['sgpt', 'SGPT'], ['creat', 'Creatinine'], ['bsl', 'BSL'], ['lytes', 'Serum electrolytes'], ['ttg', 'tTG-IgA with total IgA'],
    ['thyroid', 'Free T4 and TSH'], ['hormones', 'FSH / LH / Estradiol / Testosterone'], ['boneAge', 'Bone age (report)']];

  function viewVisitForm(pid, vid) {
    const p = S.state.patients.get(pid);
    if (!p) return viewPatient(pid);
    const v = vid ? S.state.visits.get(vid) : { date: today() };
    const n = v.notes || {}, inv = n.inv || {};
    const prev = visitsOf(pid).filter(x => x.id !== vid).pop();
    return `<div class="top"><button class="iconbtn" data-act="open" data-id="${pid}" aria-label="Back">${I.back}</button><div class="ttl">${esc(p.name)}</div><span style="width:52px"></span></div>
    <form class="form" id="vForm" autocomplete="off">
      <div><span class="flabel">Visit date ${vid ? '' : '<span style="font-weight:600;color:var(--muted)">(change only for old records)</span>'}</span>${dateTriple('date', v.date, true)}</div>
      <div class="two big"><div class="field"><label>Height</label><div class="unit"><input name="height" inputmode="decimal" value="${esc(v.height)}" placeholder="${prev ? esc(prev.height) : ''}"><span>cm</span></div></div>
        <div class="field"><label>Weight</label><div class="unit"><input name="weight" inputmode="decimal" value="${esc(v.weight)}" placeholder="${prev ? esc(prev.weight) : ''}"><span>kg</span></div></div></div>
      <div class="live" id="vLive"></div>
      <div class="field"><label>Bone age (optional)</label><div class="unit"><input name="boneAge" inputmode="decimal" value="${esc(v.boneAge)}" placeholder="e.g. 9.5"><span>yrs</span></div></div>
      <details class="more"><summary>Clinical notes (optional)</summary><p class="hint">Anything typed here prints on the OPD sheet. Leave blank to write by hand.</p><div class="form">
        ${NOTE_FIELDS.filter(f => !f[3] || f[3] === p.sex).map(([k, l, t]) => `<div class="field"><label>${l}</label>${t === 'area' ? `<textarea name="n_${k}">${esc(n[k])}</textarea>` : `<input name="n_${k}" value="${esc(n[k])}">`}</div>`).join('')}
      </div></details>
      <details class="more"><summary>Investigation results (optional)</summary><div class="form">
        ${INV_FIELDS.map(([k, l]) => `<div class="field"><label>${l}</label><input name="i_${k}" value="${esc(inv[k])}"></div>`).join('')}</div></details>
      <details class="more"><summary>Advice & next visit</summary><div class="form">
        <div class="field"><label>Advice / treatment</label><textarea name="n_advice">${esc(n.advice)}</textarea></div>
        <div><span class="flabel">Next visit</span>${dateTriple('next', n.nextVisit, false)}</div></div></details>
      <div class="err" id="vErr"></div>
      ${vid ? `<button type="button" class="btn danger" data-act="deleteVisit" data-id="${pid}" data-v="${vid}">Delete this visit</button>` : ''}
    </form>
    <div class="stickybar"><div class="inner"><button class="cta gold" data-act="saveVisit" data-id="${pid}" data-v="${vid || ''}">Save visit</button></div></div>`;
  }

  function viewSettings() {
    const st = S.state;
    const cfg = st.settings || {};
    const sz = cfg.textSize || 'normal';
    const hvT = cfg.hvThreshold || 4;
    return `<div class="top"><span style="width:56px"></span><div class="ttl">Settings</div><span style="width:56px"></span></div>
      ${updateBanner()}
      <div class="card" style="margin-bottom:12px">
        <div class="flabel" style="margin-bottom:8px">Text size</div>
        <div class="seg sm">${[['normal', 'Normal'], ['large', 'Large'], ['xlarge', 'Extra large']].map(([k, l]) =>
          `<button type="button" class="${sz === k ? 'on' : ''}" data-act="textSize" data-v="${k}">${l}</button>`
        ).join('')}</div>
        <div class="flabel" style="margin:16px 0 8px">Height velocity alert below (age &gt; 3 y)</div>
        <div class="seg sm">${[[3.5, '3.5'], [4, '4 cm/yr'], [4.5, '4.5'], [5, '5']].map(([v, l]) =>
          `<button type="button" class="${Number(hvT) === v ? 'on' : ''}" data-act="hvThresh" data-v="${v}">${l}</button>`
        ).join('')}</div>
      </div>
      <div class="card settings">
        <div class="row" data-act="nav" data-to="/reports"><span class="ic">${I.bar}</span><div>Reports<small>Patient counts and CSV export</small></div></div>
        <div class="row" data-act="printBlank"><span class="ic">${I.sheet}</span><div>Print blank OPD sheet<small>Front and back, A4</small></div></div>
        ${S.cloudConfigured ? `<div class="row" data-act="sync"><span class="ic">${I.sync}</span><div>Sync now<small>${st.lastSync ? 'Last synced ' + new Date(st.lastSync).toLocaleString('en-IN') : 'Not synced yet'} · ${st.pending} waiting${st.user ? ' · ' + esc(st.user.email) : ''}</small></div></div>` : ''}
        <div class="row" data-act="showPending"><span class="ic">${I.up}</span><div>Pending uploads<small>${st.pending} record${st.pending === 1 ? '' : 's'} waiting to upload</small></div></div>
        <div class="row" data-act="exportJson"><span class="ic">${I.down}</span><div>Save a backup file<small>All patients and visits (send it to Google Drive or WhatsApp)</small></div></div>
        <div class="row" data-act="exportCsv"><span class="ic">${I.down}</span><div>Export to Excel (CSV)<small>One row per visit, with SDS</small></div></div>
        <div class="row" data-act="importJson"><span class="ic">${I.up}</span><div>Restore from a backup file<small>Adds records that are missing</small></div></div>
        ${S.cloudConfigured ? `<div class="row" data-act="logout"><span class="ic">${I.out}</span><div>Sign out</div></div>` : ''}
      </div>
      <input type="file" id="importFile" accept="application/json,.json" hidden>
      ${syncPill()}
      <p class="fineprint">Growth references: WHO Child Growth Standards 2006 (0–5 years); IAP 2015 growth charts for 5–18 years (Khadilkar V et al., Indian Pediatr 2015;52:47–55). Height and weight SDS for 5–18 years are computed from the published IAP centile tables; BMI SDS uses LMS values fitted to the published IAP BMI table. Mid-parental height = (father + mother ± 13) / 2; target range ± 8.5 cm. Figures support, and do not replace, clinical judgement.</p>
      ${bottomNav('settings')}`;
  }

  // ======================================================
  //  ROUTER
  // ======================================================
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    if (S.state.cloud && !S.state.user) return ['login'];
    if (!parts.length || parts[0] === 'today') return ['today'];
    if (parts[0] === 'appointments') return ['appointments'];
    if (parts[0] === 'book') return ['book', parts[1] || null];
    if (parts[0] === 'patients') return ['patients'];
    if (parts[0] === 'reports') return ['reports'];
    if (parts[0] === 'new') return ['pform'];
    if (parts[0] === 'settings') return ['settings'];
    if (parts[0] === 'p' && parts[2] === 'edit') return ['pform', parts[1]];
    if (parts[0] === 'p' && parts[2] === 'visit') return ['vform', parts[1], parts[3] === 'new' ? null : parts[3]];
    if (parts[0] === 'p') return ['patient', parts[1]];
    return ['today'];
  }
  function render(keepScroll) {
    const r = route(), y = window.scrollY;
    ui.view = r[0];
    $app.innerHTML = r[0] === 'login' ? viewLogin()
      : r[0] === 'today' ? viewToday()
      : r[0] === 'appointments' ? viewAppointments()
      : r[0] === 'book' ? viewBookAppointment(r[1])
      : r[0] === 'patients' ? viewPatients()
      : r[0] === 'reports' ? viewReports()
      : r[0] === 'patient' ? viewPatient(r[1])
      : r[0] === 'pform' ? viewPatientForm(r[1])
      : r[0] === 'vform' ? viewVisitForm(r[1], r[2])
      : viewSettings();
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    if (r[0] === 'pform') updateMph();
    if (r[0] === 'vform') updateLive();
  }
  window.addEventListener('hashchange', () => render(false));
  S.onChange(() => { if (['today', 'appointments', 'patients', 'reports', 'patient', 'settings', 'login'].includes(ui.view)) { const f = document.activeElement && document.activeElement.id === 'q'; render(true); if (f) { const q = document.getElementById('q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); } } });

  // ---------- live calculations ----------
  function updateMph() {
    const f = document.getElementById('pForm'), box = document.getElementById('mphLive');
    if (!f || !box) return;
    const sex = f.sex.value, m = G.mph(sex || 'M', G.num(f.fatherHt.value), G.num(f.motherHt.value));
    if (!sex || !m) { box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML = `<div>MPH<b>${n1(m.value)} <small>cm</small></b></div><div>MPH SDS<b>${sd(m.sds)}</b></div><div>Target<b>${n1(m.low)}–${n1(m.high)}</b></div>`;
  }
  function updateLive() {
    const f = document.getElementById('vForm'), box = document.getElementById('vLive');
    if (!f || !box) return;
    const p = S.state.patients.get(route()[1]);
    const date = readDate(f, 'date');
    const a = G.analyse(p, { date, height: f.height.value, weight: f.weight.value });
    box.innerHTML = `<div>Age<b>${date ? a.ageText : '—'}</b></div><div>BMI<b>${n1(a.bmi)}</b></div><div>BMI SDS<b>${sd(a.bSds)}</b></div>
      <div>Ht SDS<b>${sd(a.hSds)} <small>${a.hSds != null ? G.centileText(a.hSds) : ''}</small></b></div><div>Wt SDS<b>${sd(a.wSds)} <small>${a.wSds != null ? G.centileText(a.wSds) : ''}</small></b></div><div>Status<b style="font-size:17px">${a.bmiCat || '—'}</b></div>`;
  }

  // ---------- actions ----------
  async function savePatient(id) {
    const f = document.getElementById('pForm'), err = document.getElementById('pErr');
    const name = val(f, 'name'), sex = f.sex.value, dob = readDate(f, 'dob');
    const problems = [];
    if (!name) problems.push('name');
    if (!sex) problems.push('boy or girl');
    if (!dob) problems.push('a valid date of birth');
    else if (dob > today()) problems.push('a date of birth that is not in the future');
    for (const k of ['fatherHt', 'motherHt']) { const v = G.num(f[k].value); if (f[k].value && !(v > 100 && v < 230)) problems.push((k === 'fatherHt' ? 'father' : 'mother') + '’s height in cm (100–230)'); }
    const gw = G.num(f.b_gestWeeks && f.b_gestWeeks.value);
    if (f.b_term.value === 'Preterm' && f.b_gestWeeks.value && !(gw >= 22 && gw <= 42)) problems.push('gestational age in weeks (22–42)');
    if (problems.length) { err.textContent = 'Please enter ' + problems.join(', ') + '.'; err.scrollIntoView({ block: 'center' }); return; }
    if (!id && window.Helpers) {
      const dupes = window.Helpers.findDuplicates(S.patients(), { name, dob, phone: val(f, 'phone') }, id);
      if (dupes.length) {
        const d = dupes[0];
        const act = await modal('Possible duplicate patient', `${d.patient.name} (${nice(d.patient.dob)}) — ${d.reason}.`, [
          { label: 'Open existing patient', value: 'open', cls: 'cta' },
          { label: 'Save as new anyway', value: 'save', cls: 'btn' },
          { label: 'Go back', value: null, cls: 'btn' },
        ]);
        if (act === 'open') { go('/p/' + d.patient.id); return; }
        if (act !== 'save') return;
      }
    }
    const old = id ? S.state.patients.get(id) : {};
    const rec = { ...old, name, sex, dob, phone: val(f, 'phone'), address: val(f, 'address'), refBy: val(f, 'refBy'),
      fatherHt: val(f, 'fatherHt'), motherHt: val(f, 'motherHt'),
      birth: { term: f.b_term.value, gestWeeks: val(f, 'b_gestWeeks'), aga: f.b_aga.value, weight: val(f, 'b_weight').replace(/\s*kg$/i, ''), nicu: f.b_nicu.value },
      history: { development: val(f, 'h_development'), family: val(f, 'h_family'), past: val(f, 'h_past') } };
    if (!id) rec.id = S.uuid();
    if (!rec.code) rec.code = 'PE-' + rec.id.replace(/-/g, '').slice(0, 5).toUpperCase();
    const saved = await S.save('patients', rec);
    if (!id && ui.prefillPatient && ui.prefillPatient.apptId) {
      const ap = S.state.appointments.get(ui.prefillPatient.apptId);
      if (ap) await S.save('appointments', { ...ap, patientId: saved.id, kind: 'existing', status: 'done' });
      ui.prefillPatient = null;
    }
    toast('Patient saved');
    go(id ? '/p/' + id : '/p/' + saved.id + '/visit/new');
  }

  async function saveAppt() {
    const f = document.getElementById('apForm'), err = document.getElementById('apErr');
    const isNew = ui.bookTab === 'new';
    const date = readDate(f, 'ap_date');
    const pid = isNew ? null : val(f, 'ap_pid');
    const name = isNew ? val(f, 'ap_name') : ((S.state.patients.get(pid) || {}).name || '');
    const problems = [];
    if (!isNew && !pid) problems.push('an existing patient');
    if (isNew && !name) problems.push('the child’s name');
    if (!date) problems.push('a valid appointment date');
    if (problems.length) { err.textContent = 'Please enter ' + problems.join(', ') + '.'; return; }
    await S.save('appointments', {
      id: S.uuid(),
      kind: isNew ? 'new' : 'existing',
      patientId: pid || null,
      name,
      sex: isNew ? (f.ap_sex && f.ap_sex.value) : '',
      phone: isNew ? val(f, 'ap_phone') : '',
      date,
      time: val(f, 'ap_time'),
      reason: val(f, 'ap_reason'),
      status: 'scheduled',
    });
    ui.apDate = date;
    ui.apMonth = date.slice(0, 7);
    ui.apView = 'day';
    ui.bookPid = '';
    ui.bookPickQ = '';
    toast('Appointment saved');
    go('/appointments');
  }

  async function saveVisit(pid, vid) {
    const f = document.getElementById('vForm'), err = document.getElementById('vErr');
    const p = S.state.patients.get(pid);
    const date = readDate(f, 'date');
    const h = G.num(f.height.value), w = G.num(f.weight.value);
    const problems = [];
    if (!date) problems.push('a valid visit date');
    else if (date < p.dob) problems.push('a visit date after the date of birth');
    if (!h && !w) problems.push('height or weight');
    if (h && !(h > 30 && h < 230)) problems.push('height in cm (30–230)');
    if (w && !(w > 0.5 && w < 250)) problems.push('weight in kg');
    if (problems.length) { err.textContent = 'Please enter ' + problems.join(', ') + '.'; err.scrollIntoView({ block: 'center' }); return; }
    // gentle check against the previous visit
    const prev = visitsOf(pid).filter(x => x.id !== vid && x.date < date).pop();
    if (prev && h && G.num(prev.height) && h < G.num(prev.height) - 1.5) {
      const ok = await modal('Height is lower than last time', `Previous height was ${prev.height} cm on ${nice(prev.date)}. Save ${h} cm anyway?`, [{ label: 'Yes, save it', value: true, cls: 'cta' }, { label: 'Go back and check', value: false, cls: 'btn' }]);
      if (!ok) return;
    }
    const notes = {};
    for (const [k] of NOTE_FIELDS) if (f['n_' + k]) notes[k] = val(f, 'n_' + k);
    notes.advice = val(f, 'n_advice');
    notes.nextVisit = readDate(f, 'next') || '';
    notes.inv = {}; for (const [k] of INV_FIELDS) notes.inv[k] = val(f, 'i_' + k);
    const old = vid ? S.state.visits.get(vid) : {};
    await S.save('visits', { ...old, ...(vid ? {} : { id: S.uuid() }), patientId: pid, date, height: h != null ? String(h) : '', weight: w != null ? String(w) : '', boneAge: val(f, 'boneAge'), notes });
    go('/p/' + pid);
    const choice = await modal('Visit saved', 'Print now?', [{ html: `${I.print} OPD sheet`, value: 'opd', cls: 'cta' }, { html: `${I.chart} Growth charts`, value: 'charts', cls: 'btn' }, { label: 'Not now', value: null, cls: 'btn' }]);
    if (choice === 'opd') printOpd(pid); else if (choice === 'charts') printCharts(pid);
  }

  function printOpd(pid, vid) {
    const p = S.state.patients.get(pid), vs = visitsOf(pid);
    const v = vid ? S.state.visits.get(vid) : vs[vs.length - 1];
    window.Print.doPrint(window.Print.opdSheet(p, v || { date: today() }, vs));
  }
  function printCharts(pid) {
    const p = S.state.patients.get(pid);
    window.Print.doPrint(window.Print.chartPages(p, visitsOf(pid)));
  }
  function openChartModal(pid) {
    const p = S.state.patients.get(pid); if (!p) return;
    const tab = ui.tab[pid] || 'h';
    const pts = points(p), mph = G.mph(p.sex, G.num(p.fatherHt), G.num(p.motherHt));
    const m = document.createElement('div'); m.className = 'modal chart-modal';
    const draw = () => {
      const zLvl = ui.full[pid] ? 0 : (ui.zoom[pid] || 1), full = zLvl === 0;
      const w = window.Charts.windowFor(tab, p.sex, pts, full, tab === 'h' ? mph : null, zLvl);
      const svg = window.Charts.render({ id: 'mdl', mode: 'screen', measure: tab, sex: p.sex, points: pts, mph: tab === 'h' ? mph : null, showPointLabels: zLvl >= 2, ...w, W: 480, H: 420 });
      m.innerHTML = `<div class="sheet-in"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <h3 style="margin:0">${esc(p.name)} · ${{ h: 'Height', w: 'Weight', b: 'BMI' }[tab]}</h3>
        <button class="zbtn" data-mact="close" aria-label="Close">✕</button></div>
        <div class="chartbox">${svg}</div>
        <div class="zoombar" style="justify-content:center;margin-top:10px">
          <button class="zbtn" data-mact="out" ${zLvl <= 0 ? 'disabled' : ''}>− Zoom out</button>
          <button class="zbtn ${zLvl >= 2 ? 'on' : ''}" data-mact="in" ${zLvl >= 3 ? 'disabled' : ''}>+ Zoom in ${zLvl >= 2 ? `(${zLvl}×)` : ''}</button>
          <button class="zbtn" data-mact="full">${full ? 'Patient' : '0–18 y'}</button>
        </div></div>`;
    };
    m.addEventListener('click', e => {
      if (e.target === m) { m.remove(); render(true); return; }
      const b = e.target.closest('[data-mact]'); if (!b) return;
      const act = b.dataset.mact;
      if (act === 'close') { m.remove(); render(true); return; }
      if (act === 'in') { ui.full[pid] = false; ui.zoom[pid] = Math.min(3, (ui.zoom[pid] || 1) + 1); }
      else if (act === 'out') { const c = ui.full[pid] ? 0 : (ui.zoom[pid] || 1); if (c <= 1) { ui.full[pid] = true; ui.zoom[pid] = 1; } else { ui.full[pid] = false; ui.zoom[pid] = c - 1; } }
      else if (act === 'full') { ui.full[pid] = !ui.full[pid]; if (!ui.full[pid] && !ui.zoom[pid]) ui.zoom[pid] = 1; }
      draw();
    });
    draw();
    document.body.appendChild(m);
  }

  async function shareOrDownload(name, text, type) {
    const blob = new Blob([text], { type });
    const file = new File([blob], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function exportCsv() {
    const rows = [['Patient ID', 'Name', 'Sex', 'DOB', 'Father ht', 'Mother ht', 'MPH', 'MPH SDS', 'Visit date', 'Age (y)', 'Height', 'Ht SDS', 'Weight', 'Wt SDS', 'BMI', 'BMI SDS', 'Bone age', 'Diagnosis']];
    for (const p of S.patients()) {
      const m = G.mph(p.sex, G.num(p.fatherHt), G.num(p.motherHt));
      for (const v of visitsOf(p.id)) {
        const a = G.analyse(p, v), r2 = x => x == null ? '' : x.toFixed(2);
        rows.push([p.code, p.name, p.sex, p.dob, p.fatherHt, p.motherHt, m ? m.value.toFixed(1) : '', m ? r2(m.sds) : '', v.date, a.age != null ? a.age.toFixed(2) : '',
          v.height, r2(a.hSds), v.weight, r2(a.wSds), a.bmi ? a.bmi.toFixed(1) : '', r2(a.bSds), v.boneAge, (v.notes || {}).diagnosis || '']);
      }
    }
    const csv = '﻿' + rows.map(r => r.map(c => { c = c == null ? '' : String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',')).join('\r\n');
    await shareOrDownload(`endoclinic-visits-${today()}.csv`, csv, 'text/csv');
  }

  // ---------- events ----------
  $app.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case 'home': go('/'); break;
      case 'nav': go(el.dataset.to); break;
      case 'settings': go('/settings'); break;
      case 'textSize': await S.setSetting('textSize', el.dataset.v); applyTextSize(); break;
      case 'hvThresh': await S.setSetting('hvThreshold', Number(el.dataset.v)); break;
      case 'applyUpdate': if (ui.swWaiting) { ui.swWaiting.postMessage({ type: 'SKIP_WAITING' }); } break;
      case 'showPending': {
        const items = await S.pendingItems();
        const desc = items.length ? items.map(x => `${x.table}: ${(x.doc && (x.doc.name || x.doc.date)) || x.rowId}`).join('\n') : 'All local changes are already synced.';
        const act2 = await modal(`Pending uploads (${items.length})`, desc, items.length && S.cloudConfigured
          ? [{ label: 'Sync now', value: 'sync', cls: 'cta' }, { label: 'Close', value: null, cls: 'btn' }]
          : [{ label: 'Close', value: null, cls: 'btn' }]);
        if (act2 === 'sync') { S.sync(); toast('Syncing…'); }
        break;
      }
      case 'newPatient': ui.prefillPatient = null; go('/new'); break;
      case 'bookNew': ui.bookPid = ''; ui.bookPickQ = ''; go('/book'); break;
      case 'bookFor': go('/book/' + id); break;
      case 'bookTab': ui.bookTab = el.dataset.v; render(true); break;
      case 'pickPatient': ui.bookPid = el.dataset.id; render(true); break;
      case 'apSex': {
        const f = document.getElementById('apForm'); f.ap_sex.value = el.dataset.v;
        f.querySelectorAll('[data-sex] button').forEach(b => { b.className = b.dataset.v + (b.dataset.v === el.dataset.v ? ' on ' + b.dataset.v : ''); });
        break;
      }
      case 'apTime': { const f = document.getElementById('apForm'); f.ap_time.value = el.dataset.v; break; }
      case 'saveAppt': e.preventDefault(); saveAppt(); break;
      case 'calDay': ui.apDate = el.dataset.d; ui.apMonth = el.dataset.d.slice(0, 7); ui.apView = 'day'; render(true); break;
      case 'calToday': ui.apDate = today(); ui.apMonth = today().slice(0, 7); ui.apView = 'day'; render(true); break;
      case 'calMonth': {
        const [y, m] = (ui.apMonth || today().slice(0, 7)).split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1 + Number(el.dataset.dir), 1));
        ui.apMonth = dt.toISOString().slice(0, 7);
        render(true); break;
      }
      case 'apView': ui.apView = el.dataset.v; render(true); break;
      case 'registerAppt': {
        const ap = S.state.appointments.get(el.dataset.a);
        if (ap) { ui.prefillPatient = { name: ap.name, sex: ap.sex, phone: ap.phone, apptId: ap.id }; go('/new'); }
        break;
      }
      case 'doneAppt': {
        const ap = S.state.appointments.get(el.dataset.a);
        if (ap) { await S.save('appointments', { ...ap, status: 'done' }); toast('Marked done'); }
        break;
      }
      case 'delAppt': {
        const ok = await modal('Cancel this appointment?', '', [{ label: 'Cancel appointment', value: true, cls: 'cta' }, { label: 'Keep', value: false, cls: 'btn' }]);
        if (ok) { await S.remove('appointments', el.dataset.a); toast('Appointment cancelled'); }
        break;
      }
      case 'open': go(id ? '/p/' + id : '/'); break;
      case 'editPatient': go('/p/' + id + '/edit'); break;
      case 'newVisit': go('/p/' + id + '/visit/new'); break;
      case 'editVisit': go('/p/' + id + '/visit/' + el.dataset.v); break;
      case 'tab': ui.tab[id] = el.dataset.k; render(true); break;
      case 'zoom': ui.full[id] = !ui.full[id]; if (!ui.full[id] && !ui.zoom[id]) ui.zoom[id] = 1; render(true); break;
      case 'zoomIn': ui.full[id] = false; ui.zoom[id] = Math.min(3, (ui.zoom[id] || 1) + 1); render(true); break;
      case 'zoomOut': {
        const cur = ui.full[id] ? 0 : (ui.zoom[id] || 1);
        if (cur <= 1) { ui.full[id] = true; ui.zoom[id] = 1; } else { ui.full[id] = false; ui.zoom[id] = cur - 1; }
        render(true); break;
      }
      case 'zoomModal': openChartModal(id); break;
      case 'printOpd': printOpd(id); break;
      case 'printCharts': printCharts(id); break;
      case 'printBlank': window.Print.doPrint(window.Print.opdSheet(null, null, [])); break;
      case 'savePatient': e.preventDefault(); savePatient(id || null); break;
      case 'saveVisit': e.preventDefault(); saveVisit(id, el.dataset.v || null); break;
      case 'sex': {
        const f = document.getElementById('pForm'); f.sex.value = el.dataset.v;
        f.querySelectorAll('[data-sex] button').forEach(b => { b.className = b.dataset.v + (b.dataset.v === el.dataset.v ? ' on ' + b.dataset.v : ''); });
        updateMph(); break;
      }
      case 'choose': {
        const box = el.closest('[data-choice]'), inp = box.querySelector('input');
        inp.value = inp.value === el.dataset.v ? '' : el.dataset.v;
        box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === inp.value)); break;
      }
      case 'today': {
        const f = el.closest('form'), n = el.dataset.for, [y, m, d] = today().split('-');
        f[n + '_d'].value = +d; f[n + '_m'].value = +m; f[n + '_y'].value = y; updateLive(); break;
      }
      case 'deletePatient': {
        const ok = await modal('Delete this patient?', 'All visits of this patient will also be removed.', [{ label: 'Delete', value: true, cls: 'cta' }, { label: 'Cancel', value: false, cls: 'btn' }]);
        if (ok) { await S.remove('patients', id); toast('Patient deleted'); go('/'); } break;
      }
      case 'deleteVisit': {
        const ok = await modal('Delete this visit?', '', [{ label: 'Delete', value: true, cls: 'cta' }, { label: 'Cancel', value: false, cls: 'btn' }]);
        if (ok) { await S.remove('visits', el.dataset.v); toast('Visit deleted'); go('/p/' + id); } break;
      }
      case 'sync': S.sync(); toast('Syncing…'); break;
      case 'exportJson': shareOrDownload(`endoclinic-backup-${today()}.json`, JSON.stringify(await S.exportAll()), 'application/json'); break;
      case 'exportCsv': exportCsv(); break;
      case 'importJson': document.getElementById('importFile').click(); break;
      case 'logout': { const ok = await modal('Sign out?', 'You will need the email and password to sign in again.', [{ label: 'Sign out', value: true, cls: 'cta' }, { label: 'Cancel', value: false, cls: 'btn' }]); if (ok) { await S.signOut(); go('/'); render(); } break; }
    }
  });
  $app.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'q') { ui.q = t.value; const pos = t.selectionStart; render(true); const q = document.getElementById('q'); q.focus(); q.setSelectionRange(pos, pos); return; }
    if (t.id === 'apPickQ') { ui.bookPickQ = t.value; const pos = t.selectionStart; render(true); const q = document.getElementById('apPickQ'); q.focus(); q.setSelectionRange(pos, pos); return; }
    // auto-advance in DD / MM / YYYY boxes
    const box = t.closest('[data-date]');
    if (box && t.maxLength > 0 && t.value.length >= t.maxLength) { const ins = [...box.querySelectorAll('input')]; const i = ins.indexOf(t); if (ins[i + 1]) ins[i + 1].focus(); }
    if (t.form && t.form.id === 'pForm') updateMph();
    if (t.form && t.form.id === 'vForm') updateLive();
  });
  $app.addEventListener('change', async e => {
    if (e.target.id !== 'importFile' || !e.target.files[0]) return;
    try { const n = await S.importAll(JSON.parse(await e.target.files[0].text())); toast(n + ' records restored'); }
    catch (err) { modal('Could not restore', err.message, [{ label: 'OK', value: 1, cls: 'btn' }]); }
    e.target.value = '';
  });
  $app.addEventListener('submit', async e => {
    if (e.target.id !== 'loginForm') return;
    e.preventDefault();
    const f = e.target, err = document.getElementById('loginErr');
    err.textContent = '';
    try { await S.signIn(f.email.value.trim(), f.password.value); go('/'); render(); }
    catch (x) { err.textContent = x.message === 'Invalid login credentials' ? 'Email or password is not correct.' : x.message; }
  });

  // ---------- boot ----------
  (async function boot() {
    await S.load();
    applyTextSize();
    try { await S.initCloud(); } catch (e) { console.warn('Cloud unavailable (offline?)', e); }
    render();
    S.sync();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').then(reg => {
        if (reg.waiting) { ui.swWaiting = reg.waiting; render(true); }
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) { ui.swWaiting = nw; render(true); }
          });
        });
      }).catch(() => {});
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !refreshing) { refreshing = true; location.reload(); } });
    }
  })();
})();
