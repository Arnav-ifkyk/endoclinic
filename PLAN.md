# EndoClinic Revamp — Implementation Plan

> **Status:** Awaiting approval before any Phase 1 code changes.
> **Baseline repo state:** Vanilla JS PWA (`97.4 KB` total JS across 8 files), self-hosted fonts at repo root, Supabase (`patients`, `visits`), offline-first IndexedDB + outbox sync.

---

## 1. Guiding Constraints

- **3-tap core flow preserved:** Open app → find/add patient → enter height & weight → see SDS & chart → print. Every new clinical module sits one level deeper (tabs inside patient view or Settings/Reports) and never blocks the core OPD path.
- **No build step to run the app:** Plain ES/IIFE scripts served directly on GitHub Pages. Total non-vendor JS stays well under **250 KB** uncompressed (target ~150–190 KB).
- **Clinical & data safety:**
  - `growth.js` IAP 2015 piecewise-linear `(z, log value)` interpolation and `refdata.js` tables remain untouched.
  - All `patients.doc` and `visits.doc` changes are strictly **additive** (`schemaVersion: 2` on new/edited docs, full read/print support for legacy docs without `schemaVersion`).
  - Soft deletes only (`deleted = true`); never hard-delete.
  - Never overwrite `config.js` keys or run SQL against the live Supabase project directly.

---

## 2. Proposed File Structure

Keeping the repo flat and dependency-free at runtime (with optional `package.json` solely for Playwright CI/local E2E tests):

```text
endoclinic/
├── index.html                  # App shell, strict CSP <meta>, screen + A4/A5 print CSS, 4-tab bottom nav
├── config.js                   # Existing Supabase URL/key + letterhead (never overwritten)
├── config.example.js           # Safe template with empty keys and setup comments
├── refdata.js                  # Existing WHO 2006 + IAP 2015 tables (untouched; optional cited WHO HC table if verified)
├── growth.js                   # Existing SDS/MPH/BMI/HV math + preterm corrected age + centile-crossing & clinical flags
├── charts.js                   # Screen + print SVG charts (adds -2.25, -2.5, -3 SD red height lines + preterm markers)
├── print.js                    # OPD 2-page sheet, growth charts, Rx sheet (A4/A5), follow-up card
├── store.js                    # IndexedDB + outbox + Supabase sync, profiles/role fetch, audit fetch, merge restore, PIN hash
├── i18n.js                     # Patient-facing print strings (English / मराठी / हिंदी) for Rx advice & follow-up card
├── helpers.js                  # Dose calculators (GH, levothyroxine, insulin), duplicate check, CSV import/export
├── app.js                      # Hash router, Today / Patients / Reports / Settings tabs, Patient sub-tabs, modals
├── sw.js                       # Offline cache (app shell + fonts + supabase-js; never caches Supabase API), update prompt
├── manifest.webmanifest        # PWA manifest
├── logo.png / icon-192.png / icon-512.png
├── fraunces-*.woff2 / manrope-*.woff2   # Kept at repo root (or moved only with updated index.html + sw.js)
├── templates/
│   └── old-records-template.csv         # Downloadable CSV import template
├── supabase/
│   ├── README.md               # Click-by-click Supabase SQL Editor, Auth, Roles, pause/restore guide
│   └── migrations/
│       ├── 001_grants_and_schema_hardening.sql  # Explicit GRANTs + idempotent baseline verification
│       ├── 002_profiles_and_role_rls.sql        # profiles table + doctor/staff RLS + soft-delete protection
│       └── 003_audit_log_and_triggers.sql       # audit_log table + trigger on update/soft-delete + doctor-only RLS
├── tests/
│   ├── growth.test.js          # node:test unit suite (all required IAP/WHO/MPH assertions + preterm, flags, doses, CSV, dupes)
│   └── e2e/
│       ├── app.spec.js         # Playwright 390x844 E2E flows with mocked Supabase (no live project hits)
│       └── generate-samples.js # Generates A4/A5 sample PDFs into docs/samples/
├── docs/
│   └── samples/                # Sample PDFs (OPD boy/girl/blank, growth charts, Rx, follow-up card)
├── .github/workflows/
│   └── deploy.yml              # node --test -> Playwright -> stamp sw.js VERSION with SHA -> deploy Pages
├── README.md
├── DEPLOY.md
├── USER_GUIDE.md               # Simple English (+ Marathi summary) with 390px screenshots
├── CLAUDE.md                   # Architecture, clinical rules, sync/RLS notes for future agents
├── CHANGELOG.md
└── PLAN.md
```

---

## 3. Data-Model Changes (Backward-Compatible, Additive Only)

### `patients.doc` (existing keys preserved unchanged)
```jsonc
{
  // Existing fields (unchanged)
  "id": "uuid",
  "code": "PE-XXXXX",
  "name": "...",
  "sex": "M" | "F",
  "dob": "YYYY-MM-DD",
  "phone": "...",
  "address": "...",
  "refBy": "...",
  "fatherHt": "...",
  "motherHt": "...",
  "birth": {
    "term": "Full term" | "Preterm" | "",
    "aga": "AGA" | "SGA" | "LGA" | "",
    "weight": "...",
    "nicu": "Yes" | "No" | "",
    "gestWeeks": ""          // NEW (optional, e.g. "32" for preterm corrected age < 2 y)
  },
  "history": {
    "development": "...",
    "family": "...",
    "past": "..."
  },
  "createdAt": "ISO-8601",

  // Additive v2 fields (optional; tolerated if missing)
  "schemaVersion": 2,
  "createdBy": { "id": "uuid", "name": "..." },
  "updatedBy": { "id": "uuid", "name": "..." },
  "labs": [
    { "id": "uuid", "test": "TSH", "value": "4.2", "unit": "mIU/L", "date": "YYYY-MM-DD" }
  ],
  "puberty": [
    { "id": "uuid", "date": "YYYY-MM-DD", "tannerBOrG": "2", "tannerPH": "2", "tvR": "4", "tvL": "4", "menarcheDate": "" }
  ]
}
```
*Note on storing `labs` and `puberty`:* Storing structured labs/puberty either inside `patients.doc` or per-visit `visits.doc` keeps zero new sync tables required while remaining 100% offline-first and JSON-backup compatible. (Puberty snapshots can also auto-populate from visit notes or live in `patients.doc.puberty` sorted by date.)

### `visits.doc` (existing keys preserved unchanged)
```jsonc
{
  // Existing fields (unchanged)
  "id": "uuid",
  "patientId": "uuid",
  "date": "YYYY-MM-DD",
  "height": "...",
  "weight": "...",
  "boneAge": "...",
  "notes": {
    "chief": "", "exam": "", "dysmorphism": "", "eyes": "", "goitre": "",
    "rickets": "", "turner": "", "acanthosis": "", "tanner": "", "puberty": "",
    "systemic": "", "diagnosis": "", "advice": "", "nextVisit": "",
    "inv": { "cbc": "", "sgpt": "", "creat": "", "bsl": "", "lytes": "", "ttg": "", "thyroid": "", "hormones": "", "boneAge": "" }
  },
  "createdAt": "ISO-8601",

  // Additive v2 fields (optional)
  "schemaVersion": 2,
  "headCirc": "",             // NEW (optional, shown only when patient < 3 y; only if WHO HC table verified)
  "medications": [            // NEW (optional Rx list: drug, dose, freq, duration, note)
    { "name": "Levothyroxine", "dose": "25 mcg", "freq": "OD before breakfast", "duration": "3 months", "notes": "" }
  ],
  "createdBy": { "id": "uuid", "name": "..." },
  "updatedBy": { "id": "uuid", "name": "..." }
}
```

### Local Settings (`IndexedDB` `meta` store — device-local, non-PHI)
- `textSize`: `'normal' | 'large' | 'xlarge'` (18px / 20px / 22px base)
- `hvThreshold`: number (default `4` cm/yr for age > 3 y)
- `printLang`: `'en' | 'mr' | 'hi'`
- `pinHash` & `pinSalt`: salted SHA-256 hash via Web Crypto (optional 4-digit lock)
- `lastBackupAt`: ISO timestamp for monthly backup reminder

---

## 4. Supabase Migrations (Idempotent SQL)

1. **`supabase/migrations/001_grants_and_schema_hardening.sql`**
   - Ensures `grant select, insert, update, delete on public.patients, public.visits to authenticated;` and indexes exist cleanly.
2. **`supabase/migrations/002_profiles_and_role_rls.sql`**
   - Creates `public.profiles(user_id uuid primary key references auth.users(id) on delete cascade, role text not null check (role in ('doctor','staff')), display_name text not null, updated_at timestamptz not null default now())`.
   - Creates `security definer` helper `public.current_user_role()`.
   - Updates `patients` and `visits` RLS policies:
     - `SELECT`, `INSERT`: allowed for `authenticated` (`doctor` or `staff`).
     - `UPDATE`: allowed for `authenticated`, **except** `NEW.deleted = true` (soft delete) requires `public.current_user_role() = 'doctor'`. (If no `profiles` row exists yet for a legacy single-doctor setup, behavior is documented clearly in `supabase/README.md` so Arnav inserts Dr. Dhawle's `'doctor'` row immediately after running `002`.)
     - `DELETE`: denied for all client roles (soft delete only).
3. **`supabase/migrations/003_audit_log_and_triggers.sql`**
   - Creates `public.audit_log(id bigserial primary key, table_name text not null, row_id uuid not null, action text not null, old_doc jsonb, new_doc jsonb, changed_by uuid default auth.uid(), changed_at timestamptz not null default now())`.
   - Attaches `AFTER UPDATE` trigger on `patients` and `visits` recording old/new `doc` and `deleted` transitions.
   - Enables RLS on `audit_log`: `SELECT` allowed only for `doctor` role; no client `INSERT/UPDATE/DELETE` (trigger writes as `security definer`).

---

## 5. Phased Execution Plan

### Phase 0 — Safety Net: Unit Tests, CI Skeleton & Pre-work Alignment
- Add `tests/growth.test.js` (`node:test`) covering all required IAP 2015, WHO 2006, and MPH assertions.
- Add `config.example.js` and strict CSP `<meta>` tag in `index.html`.
- Re-align UI foundation to Section 4 (4-tab bottom nav on top-level tabs, text-size preference Normal/Large/Extra large, `prefers-reduced-motion`).

### Phase 1 — Core OPD Improvements & DevOps
- **Today screen:** today's visits, follow-ups due (`today`, `this week`, `overdue` from `notes.nextVisit`), big `New patient` CTA & search.
- **Patients tab:** alphabetical/recent patient directory + search.
- **Extended height chart lines:** −2.25 SD, −2.5 SD, −3 SD red lines + labels on screen and A4 print.
- **Clinical flags:** neutral chips for `Ht SDS < −2`, `Ht SDS − MPH SDS < −1.5`, HV below threshold (`age > 3 y`), crossing ≥2 major centile lines downward, BMI ≥ overweight/obese, and extreme SDS (`|z| > 5`) verification prompt.
- **Preterm correction:** gestational weeks field in Birth History; corrected age calculations & chart marker below 2 y.
- **Duplicate check:** soft warning on same name+DOB or same phone+similar name.
- **SW update banner & Sync error UI:** "New version available · Tap to update" when a waiting SW is detected; real sync error details + pending uploads list in Settings.
- **CI/CD & Testing:** `.github/workflows/deploy.yml`, Playwright mocked-Supabase E2E suite, `DEPLOY.md`, Phase 1 screenshots (390px) & sample OPD/chart PDFs.

### Phase 2 — Clinical Modules & Patient Prints (behind tabs on Patient view)
- **Puberty tracker tab** (Tanner B/G & PH, testicular volume R/L, menarche date, mini timeline + OPD sheet sync).
- **Lab results tab** (structured panel + custom test, table + inline SVG mini trend line per test).
- **Treatment & dose helper tab** (GH mg/kg/wk → daily mg & mg/m²/wk via Mosteller BSA; levothyroxine mcg/kg/day; insulin U/kg/day — display-only calculators + per-visit medication list).
- **Prescription print (A4/A5) & Follow-up card print** with clinic letterhead.
- **Patient-facing print language** (`i18n.js`: English / मराठी / हिंदी) for follow-up card & advice only.
- **Share PDF / Print flow** (Web Share API + Save as PDF fallback — see clarifications below).
- Unit + Playwright tests + sample PDFs (`Rx`, `Follow-up card`) + 390px screenshots.

### Phase 3 — Practice Tools, Roles, Audit & Docs
- **Reports tab:** monthly patient count, new vs follow-up split, grouped provisional diagnosis counts + bar chart, CSV export per view.
- **CSV old-records import:** `templates/old-records-template.csv` + preview table with row error highlighting + batch create.
- **Roles (`profiles`):** doctor vs staff UI & Postgres RLS enforcement + `createdBy` attribution.
- **Record history (`audit_log`):** per-patient History drawer from Edit Patient.
- **Monthly backup reminder & merge restore:** Today banner if >30 days since backup; merge by `id` + timestamp without overwriting newer records.
- **Optional 4-digit PIN lock** in Settings (salted SHA-256 in IndexedDB).
- **Optional Head Circumference 0–2 y** (only if official WHO 2006 LMS values are verified; otherwise documented under "Needs reference data").
- Finalize `README.md`, `DEPLOY.md`, `USER_GUIDE.md`, `CLAUDE.md`, `CHANGELOG.md`, `supabase/README.md`, and `docs/samples/` PDFs.

---

## 6. Questions & Potentially Unsafe / Unclear Items (Please Confirm Before Coding)

1. **Extended red height lines (−2.25 / −2.5 / −3 SD):**
   - `growth.js` currently extrapolates IAP 2015 below the 3rd centile linearly in `(z, log value)` (`centX(z, logv)`). Should the red `−2.25`, `−2.5`, and `−3 SD` lines use `Growth.curve('h', sex, z, ...)` (piecewise-linear log extension of the IAP 2015 3rd/10th centiles), or do you have a specific published IAP extended SD table with exact numbers for −2.25/−2.5/−3 SD?
2. **Preterm corrected age cutoff & negative corrected age:**
   - Standard practice corrects up to **24 months chronological age** (and returns no WHO SDS if corrected age is < 0 months, i.e., before 40 weeks CGA). Confirm whether corrected age should stop at **24 months chronological age** (or 24 months corrected age), and confirm showing `"Pre-term (<40 wk CGA)"` instead of extrapolating WHO 2006 below 0 months.
3. **WhatsApp "Share PDF" technical constraint (Phase 2.11):**
   - `window.print()` cannot return a `.pdf` `File` object to JavaScript for `navigator.share({ files: [pdf] })`. Generating a standalone PDF binary in-browser with **Marathi/Hindi Devanagari** support without a heavy PDF + Devanagari font bundle (>250 KB JS limit) is unreliable.
   - Proposed safe approach: **"Share summary on WhatsApp"** (Web Share API text) + **"Save / Print PDF"** (`window.print()`, where Android Chrome lets you choose *Save as PDF* and share directly to WhatsApp, just as `README.md` currently explains). Is that acceptable, or do you want a lightweight pure-JS PDF generator (ASCII/English-only or canvas rasterized)?
4. **UI details from our earlier `unslop` pass vs Section 4:**
   - Section 4 asks for **pebble-shaped avatars**, `#efe8f8` lavender accents, and a **4-tab bottom bar** (`Today · Patients · Reports · Settings`), whereas our just-pushed `unslop` pass (`c811952`) used rounded-square avatars and a simpler top header.
   - Confirm: restore the pebble-shaped avatars + `#efe8f8` accents and add the 4-tab bottom bar (hidden on Patient/Form screens so the sticky Save button is unobstructed), while keeping the clean spacing, tabular figures, and no-radial-wash polish.
5. **Head circumference (Phase 3.19):**
   - Because `refdata.js` does not include WHO 2006 head-circumference LMS tables yet, we will only include it if we can verify the exact official WHO 2006 `hcfa` LMS table against published WHO centiles; otherwise we will defer it and list it under `"Needs reference data"`.
6. **GitHub Actions CI & `sw.js` / `config.js`:**
   - Confirm it is fine to add a minimal `package.json` (devDependencies: `playwright` only — zero runtime impact, no app build step) so GitHub Actions can run Playwright E2E + PDF generation cleanly before deploying to GitHub Pages.
