# Peds Endo Clinic app — setup guide

A phone app (PWA) for Dr. Dhawle's clinic: patient records, every visit kept forever, automatic BMI / SDS / MPH, IAP 2015 + WHO growth charts, and one-tap A4 printing of the OPD sheet and growth charts.

Total setup time: about 30 minutes, done once by you (not by your dad).

---

## 0. Try it first (optional, 5 minutes)

You can do step 2 (GitHub Pages) first with `config.js` left empty. The app then runs in **demo mode**: everything works, but data stays on that one phone. Play with it, then do step 1 and connect the database **before entering real patients**.

---

## 1. Create the online database (Supabase, free)

1. Go to **supabase.com** → *Start your project* → sign up (use a Google account you control).
2. **New project**
   - Name: `endoclinic`
   - Database password: make a strong one and **save it somewhere safe**
   - Region: **South Asia (Mumbai)** — keeps the data in India
3. Wait ~2 minutes for the project to start.
4. Left menu → **SQL Editor** → *New query* → open `setup/supabase-setup.sql`, copy everything, paste, press **Run**. It should say "Success".
5. Left menu → **Authentication** → find the setting **"Allow new users to sign up"** (under *Sign In / Providers*) and turn it **OFF**. This makes sure nobody else can create an account.
6. **Authentication → Users → Add user → Create new user**
   - Email: your dad's email
   - Password: something he can remember
   - Tick **Auto Confirm User**
   (You can add a second user for yourself the same way.)
7. **Project Settings → API** (may be shown as *Data API* / *API Keys*): copy
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon / public key** (a long text starting with `eyJ…`)
8. Open `config.js` and paste them:
   ```js
   supabaseUrl: 'https://abcd1234.supabase.co',
   supabaseAnonKey: 'eyJ...',
   ```
   The anon key is meant to be public; the data is protected because only signed-in users can read it (step 4) and nobody can sign up (step 5).

> **Note:** free Supabase projects pause after about a week with no use (e.g. a clinic holiday). Nothing is lost — open supabase.com and press *Restore*. The phone keeps working offline meanwhile and uploads when it's back.

---

## 2. Put the app online (GitHub Pages, free)

1. Go to **github.com** → sign in → **New repository** → name `endoclinic` → **Public** → *Create*.
   (The code contains no patient data. Patient data lives only in Supabase.)
2. On the new repo page: **Add file → Upload files** → drag in **everything inside this folder** (index.html, app.js, the `fonts` and `setup` folders, etc.) → **Commit changes**.
3. Repo **Settings → Pages** → *Source*: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → **Save**.
4. After 1–2 minutes the app is live at
   **`https://YOUR-GITHUB-NAME.github.io/endoclinic/`**

---

## 3. Install it on your dad's phone

1. Open the link above in **Chrome** on his phone.
2. Sign in with the email/password from step 1.6 (only needed once).
3. Chrome menu **⋮ → Add to Home screen / Install app**.
4. An icon with the clinic logo appears on the home screen. From now on he just taps it.

---

## 4. Printing from the phone

- **Wi-Fi printer (best):** on the phone, *Settings → Connected devices → Printing* → turn on the *Default Print Service*, or install your printer's plugin from Play Store (*HP Print Service*, *Canon Print Service*, *Mopria*…). Phone and printer must be on the same Wi-Fi.
- In the app: **OPD sheet** or **Growth charts** → choose the printer → paper **A4** → *Print*.
  The OPD sheet is 2 pages (front + back); choose *Two-sided* if the printer can.
- **No Wi-Fi printer:** in the print screen choose **Save as PDF**, then share the PDF on WhatsApp to whoever prints at the clinic.
- **Blank sheets for the pad:** Settings → *Print blank OPD sheet*.

---

## 5. Everyday use (for your dad)

- **New child:** *New patient* → name, boy/girl, date of birth, parents' heights → *Save & add first visit*.
- **Every visit:** open the child → *Add today's visit* → height + weight → *Save visit* → *Print*.
  Age, BMI, SDS, MPH and charts are all automatic, and every earlier visit stays on the chart.
- **Old records:** add the patient, then *Add today's visit* and change the date to the old date.
  Add old visits in any order; the app sorts them.

---

## 6. Safety net

- Settings → **Save a backup file** once a month → send it to Google Drive.
- Settings → **Export to Excel (CSV)** gives one row per visit with all SDS.

## 7. Changing the app later

After editing any file, open `sw.js` and change `VERSION = 'endo-v1'` to `'endo-v2'` (and so on), then upload the changed files to GitHub. Phones pick up the update the next time the app is opened online.

---

### How the numbers are calculated
- **0–5 years:** WHO Child Growth Standards 2006 (LMS method).
- **5–18 years:** IAP 2015 charts (Khadilkar V et al., *Indian Pediatr* 2015;52:47–55). Height and weight SDS are read from the published IAP centile tables (exact at every published centile). BMI SDS uses LMS values fitted to the published IAP BMI table; overweight/obese lines are the IAP adult-equivalent 23 and 27 cut-offs.
- **MPH** = (father + mother + 13) / 2 for boys, (father + mother − 13) / 2 for girls; target range ± 8.5 cm; MPH SDS against IAP height at 18 years.
- **Height velocity** = change in height ÷ time since the nearest visit at least 4 months earlier.
- Under 2 years the BMI chart and BMI SDS are not shown.

`_build/tools/` and `_build/data/` contain the scripts and source tables used to build `refdata.js`, and a test that checks the SDS against the published tables.
