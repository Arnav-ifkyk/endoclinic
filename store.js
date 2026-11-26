// store.js — records kept on the phone (IndexedDB) and synced to Supabase.
// Every save goes to the phone first, then to an "outbox" that is pushed online
// as soon as there is internet. Nothing is ever lost if the network is down.
(function (global) {
  'use strict';
  const TABLES = ['patients', 'visits'];
  let dbp = null;
  function open() {
    return dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('endoclinic', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        for (const s of ['patients', 'visits', 'outbox']) d.createObjectStore(s, { keyPath: 'id' });
        d.createObjectStore('meta', { keyPath: 'k' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  }
  async function run(store, mode, fn) {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode), req = fn(t.objectStore(store));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  const idb = {
    all: s => run(s, 'readonly', st => st.getAll()),
    get: (s, k) => run(s, 'readonly', st => st.get(k)),
    put: (s, v) => run(s, 'readwrite', st => st.put(v)),
    del: (s, k) => run(s, 'readwrite', st => st.delete(k)),
  };
  const meta = { get: async k => (await idb.get('meta', k) || {}).v, set: (k, v) => idb.put('meta', { k, v }) };

  // ---------------- state ----------------
  const state = { patients: new Map(), visits: new Map(), cloud: null, user: null, syncing: false, lastSync: null, pending: 0, error: null };
  const listeners = new Set();
  const emit = () => listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } });

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }

  async function load() {
    for (const t of TABLES) for (const r of await idb.all(t)) state[t].set(r.id, r);
    state.pending = (await idb.all('outbox')).length;
    state.lastSync = await meta.get('lastSyncAt');
  }

  async function save(table, rec) {
    rec = { ...rec };
    if (!rec.id) { rec.id = uuid(); rec.createdAt = new Date().toISOString(); }
    rec._u = Date.now();
    await idb.put(table, rec);
    state[table].set(rec.id, rec);
    await idb.put('outbox', { id: table + ':' + rec.id, table, rowId: rec.id, u: rec._u });
    state.pending++;
    emit();
    sync();
    return rec;
  }
  async function remove(table, id) {
    const rec = state[table].get(id);
    if (!rec) return;
    await save(table, { ...rec, deleted: true });
    if (table === 'patients') for (const v of visitsOf(id)) await save('visits', { ...v, deleted: true });
  }

  const live = m => [...m.values()].filter(r => !r.deleted);
  function patients() { return live(state.patients); }
  function visitsOf(pid) { return live(state.visits).filter(v => v.patientId === pid).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || '')); }

  // ---------------- cloud ----------------
  const cfg = global.ENDO_CONFIG || {};
  const cloudConfigured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  async function initCloud() {
    if (!cloudConfigured) return null;
    if (!global.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js');
    state.cloud = global.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await state.cloud.auth.getSession();
    state.user = data.session ? data.session.user : null;
    state.cloud.auth.onAuthStateChange((_e, session) => { state.user = session ? session.user : null; emit(); });
    return state.cloud;
  }
  async function signIn(email, password) {
    const { data, error } = await state.cloud.auth.signInWithPassword({ email, password });
    if (error) throw error;
    state.user = data.user; emit(); sync();
  }
  async function signOut() { if (state.cloud) await state.cloud.auth.signOut(); state.user = null; emit(); }

  function strip(rec) { const { _u, ...doc } = rec; return doc; }

  let again = false;
  async function sync() {
    if (!state.cloud || !state.user || !navigator.onLine) return;
    if (state.syncing) { again = true; return; }
    state.syncing = true; state.error = null; emit();
    try {
      // push
      const box = await idb.all('outbox');
      for (const t of TABLES) {
        const items = box.filter(b => b.table === t);
        for (let i = 0; i < items.length; i += 200) {
          const chunk = items.slice(i, i + 200);
          const rows = chunk.map(b => state[t].get(b.rowId)).filter(Boolean)
            .map(r => ({ id: r.id, doc: strip(r), deleted: !!r.deleted, ...(t === 'visits' ? { patient_id: r.patientId } : {}) }));
          if (rows.length) { const { error } = await state.cloud.from(t).upsert(rows); if (error) throw error; }
          for (const b of chunk) { const cur = state[t].get(b.rowId); if (!cur || cur._u === b.u) await idb.del('outbox', b.id); }
        }
      }
      // pull (with 10-minute overlap; merging is idempotent)
      const since = (await meta.get('lastPull')) || '1970-01-01T00:00:00Z';
      const sinceOverlap = new Date(new Date(since).getTime() - 600000).toISOString();
      const pendingIds = new Set((await idb.all('outbox')).map(b => b.id));
      let newest = since;
      for (const t of TABLES) {
        let from = 0;
        for (;;) {
          const { data, error } = await state.cloud.from(t).select('id,doc,deleted,updated_at').gt('updated_at', sinceOverlap).order('updated_at').range(from, from + 999);
          if (error) throw error;
          for (const row of data) {
            if (row.updated_at > newest) newest = row.updated_at;
            if (pendingIds.has(t + ':' + row.id)) continue;
            const rec = { ...row.doc, id: row.id, deleted: row.deleted };
            await idb.put(t, rec); state[t].set(rec.id, rec);
          }
          if (data.length < 1000) break;
          from += 1000;
        }
      }
      await meta.set('lastPull', newest);
      state.lastSync = new Date().toISOString(); await meta.set('lastSyncAt', state.lastSync);
    } catch (e) {
      console.error(e); state.error = e.message || String(e);
    } finally {
      state.pending = (await idb.all('outbox')).length;
      state.syncing = false; emit();
      if (again) { again = false; setTimeout(sync, 500); }
    }
  }
  global.addEventListener('online', () => sync());
  setInterval(() => sync(), 60000);

  // ---------------- backup ----------------
  async function exportAll() {
    return { app: 'EndoClinic', version: 1, exportedAt: new Date().toISOString(), patients: [...state.patients.values()].map(strip), visits: [...state.visits.values()].map(strip) };
  }
  async function importAll(data) {
    if (!data || data.app !== 'EndoClinic') throw new Error('This is not an EndoClinic backup file.');
    let n = 0;
    for (const t of TABLES) for (const r of data[t] || []) {
      const cur = state[t].get(r.id);
      if (!cur) { await save(t, r); n++; }
    }
    return n;
  }

  // persistent storage so Android does not evict the local copy
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  global.Store = { state, load, save, remove, patients, visitsOf, initCloud, signIn, signOut, sync, cloudConfigured, exportAll, importAll,
    onChange: f => listeners.add(f), uuid };
})(window);
