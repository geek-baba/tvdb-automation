# TVDB Submission Workflow — Strategy & Requirements (v1.0)

> Goal: A **single, reliable Tampermonkey userscript** that drives TheTVDB's 5‑step submission workflow end‑to‑end using TMDB (+ OMDb fallback), with a compact helper panel, validation, and controlled navigation.

---

## A. Canonical 5‑Step Flow

### 1. Step 1 – Create Show
**URL:** `/series/create`

**Autofill:**
- IMDb ID (tt…)
- TMDB ID (number only)
- Official Site/Press URL

**Preview:**
- TMDB Original Title + Year
- TMDB English Title + Year
- OMDb Title + Year
- Original Language (TMDB)
- OMDb Language

### 2. Step 2 – Add Series
**URL:** `/series/create-step2` (tokenized)

**Autofill:**
- **Force Original Language** from TMDB `original_language` (ISO‑639‑1 → TVDB ISO‑639‑2 mapping)
- **Name & Overview** in that original language
  - TMDB translations → `data.name`, `data.overview`
  - Fallback: `original_name`/`overview`
- **Country** (first `origin_country` match)
- **Status** (map TMDB status → TVDB)
- **Genres** (TMDB → TVDB taxonomy)

### 3. Step 3 – Bulk Add Episodes
**URL Chain:**
- `/series/{slug}#seasons`
- `/series/{slug}/seasons/official/{N}`
- `/series/{slug}/seasons/official/{N}/bulkadd`

**Autofill:**
- Episode **number**
- Episode **name**
- Episode **overview**
- **First aired** (support `<input type="date">` and text `MM/DD/YYYY`)
- **Runtime** (episode → season average → series default fallback chain)

### 4. Step 4 – Upload Poster (Legacy Uploader)
**URL:** `/artwork/upload?type=2&series={id}`

**Autofill:**
- Best TMDB poster URL
- **Language** select
- Click **Continue** (no auto final submit)

### 5. Step 5 – English Translation (Conditional)
**URL:** `/series/{id}/translate/eng`

**Condition:** Only if original language ≠ English

**Autofill:**
- English **title** from TMDB translations (en)
- English **overview** from TMDB translations (en)

---

## B. Architecture Strategy

### Primary Script
- **Single primary script:** `TVDB Workflow Helper` manages:
  - Panel UI
  - Storage
  - Page detection
  - Data fetching
  - Form filling
  - Navigation

### Auxiliary Scripts (Optional)
- `TVDB Artwork Helper` (kept disabled by default)
  - Only if you prefer isolated debugging for artwork
- `TVDB Autofill (classic)`
  - Kept as a backup while migrating
  - Disable once the unified script is stable

### Rationale
The primary script owns the **state machine** and **persistent context** (TMDB/OMDb keys, TMDB TV ID, IMDb ID, selected season, series slug/id). Smaller helpers are useful for rollback/testing but not necessary once stable.

---

## C. Data Sources & Fallbacks

### TMDB (Required)
**Endpoints:**
- `/tv/{id}?append_to_response=external_ids,images,translations`
- `/tv/{id}/season/{n}`

**Extract:**
- `original_language`
- `name`
- `original_name`
- `overview`
- `translations.translations[].data`
- `images.posters`
- `origin_country`
- `status`
- `genres[]`
- `episode_run_time[]`

### OMDb (Optional Fallback)
**Endpoint:** `/?i=tt…&type=series`

**Extract:**
- `Title`
- `Year`
- `Language`
- `totalSeasons` (weak)
- etc.

### IMDb ID Resolution
1. Prefer TMDB `external_ids.imdb_id`
2. If missing and user typed an IMDb URL or OMDb is available, parse/use OMDb response

---

## D. Persistence & Keys

### Storage Keys (GM_setValue/GM_getValue)

**Configuration:**
- `tvdbwf_tmdb_key` – TMDB API key
- `tvdbwf_omdb_key` – OMDb API key

**Context:**
- `tvdbwf_ctx` – JSON object containing:
  - `tmdbId`
  - `imdbId`
  - `originalIso1`
  - `seriesSlug`
  - `seriesId`
  - `selectedSeason`
  - `posterPick`
  - `step`
  - `review cache`

**UI Preferences:**
- `tvdbwf_ui` – JSON object containing:
  - `showPanel`
  - `autoAdvance`
  - `compactKeys`

### Behavior
Once keys are saved, **hide the fields** to keep panel compact. Provide a small **"Manage Keys"** toggle to re‑show.

---

## E. Page Detection (Deterministic)

Regular expressions on `location.pathname`:

| Step | Pattern |
|------|---------|
| Step 1 | `/series/create$` |
| Step 2 | `/series/create-step2` |
| Season list | `/series/{slug}$` |
| Season page | `/series/{slug}/seasons/official/{n}$` |
| Bulk add | `/series/{slug}/seasons/official/{n}/bulkadd$` |
| Artwork | `/artwork/upload` (query `type=2&series={id}`) |
| Translate | `/series/{id}/translate/eng$` |

---

## F. UI / UX

### Panel
- **Compact, sticky helper panel** (top‑right)
- **Side edge tab** when hidden
- **Hotkey:** Ctrl+Alt+T (Win/Linux), Control+Option+T (Mac)

### Buttons
- **Save** – Save current state
- **Apply** – Fill form fields
- **Apply & Continue ▶** – Fill and navigate to next step
- **Skip Step** – Skip current step

### Preview Box
Shows relevant data for each step:

- **Step 1:** TMDB Original Title (Year), TMDB English Title (Year), OMDb Title (Year), Languages (TMDB original, OMDb)
- **Step 2:** Original language code, Name/Overview (original language), Country, Status, Genres
- **Step 3:** Season number, row count preview
- **Step 4:** Poster URL + language
- **Step 5:** English title/overview

### Auto‑advance Toggle
- Off by default
- If enabled, automatically navigates to next step after successful *Apply*

---

## G. Filling Logic (Selectors & Events)

### Event Emittance
- Emit both `input` and `change` events after setting values
- For date inputs, support both:
  - Native `<input type="date">`
  - Text placeholders (`MM/DD/YYYY`)

### Step 1
- Find ID fields by label proximity (IMDb, TheMovieDB)
- Avoid "-seriesname" text-only rows
- Official site/press uses homepage

### Step 2
- **Language select:** Set to TVDB's ISO‑639‑2 value (mapping table)
- **Name widget:** TVDB uses a hidden `<input name="name" id="name">` and a React/Algolia visible box – set both
- **Overview textarea** by `#overview`
- **Country select:** Fuzzy match display text to TMDB `origin_country[0]`
- **Status select:** Map TMDB → TVDB labels:
  - Returning → Continuing
  - Ended/Cancelled → Ended
  - Planned/In Production/Upcoming → Upcoming
- **Genres:** Clear all; check mapped boxes
  - TMDB → TVDB taxonomy mapping maintained in a dictionary

### Step 3
- Auto‑add rows until count matches episodes (cap at 25)
- For each row:
  - Episode #
  - Name
  - Overview
  - First Aired
  - Runtime

**Runtime fallback:** Per‑episode → season average → series default

### Step 4
- Legacy uploader: Set URL field, language select (from poster language or series original language), click **Continue**

### Step 5
- Only if original language ≠ English
- Fill English title/overview from TMDB translations (en) and save

---

## H. Error Handling & Guardrails

- **Never auto‑final‑submit** irreversible actions silently
- Use *Apply* to fill and **optionally** *Apply & Continue ▶* to navigate
- **Network errors:** Show inline messages; allow retry
- **Unknown DOM layout:** Show "Unknown layout" with a link to copy DOM info for patching
- **Rate limits:** Back‑off and surface status in panel

---

## I. Testing & Rollback Plan

### Testing
1. **Dry‑run on each step** with logging enabled
2. Verify preview values match page inputs
3. **Edge cases:**
   - Shows without `external_ids.imdb_id`
   - Missing translations
   - No per‑episode runtime
   - Non‑English originals

### Rollback
- Keep `TVDB Autofill (classic)` disabled but available for quick switch‑back
- Version bump and changelog for the unified script

---

## J. Roadmap (Post‑MVP)

- Multi‑season bulk helper with season picklist
- Artwork pack (poster + fanart) chooser
- CSV import/export for episodes
- Optional background retry queue (manual trigger only)
- Quick language remap UI + one‑click translation step

---

## K. Implementation Notes (for the final script)

### Language Maps
- ISO‑639‑1 → TVDB (ISO‑639‑2) table stored inline

### Date Formatting
- TMDB `YYYY‑MM‑DD` → TVDB `MM/DD/YYYY` when needed

### Slug/ID Capture
- After Step 2 save, parse resulting page for `seriesSlug` and numeric `seriesId` (from artwork links), store in ctx

### Persistence
- `ctx.tmdbId` and `ctx.imdbId` persist across steps
- Inputs prefill from ctx but **do not overwrite** non‑empty user‑typed values on fetch

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-21  
This document is the **source of truth** for features and behavior of the unified userscript. Update the version header when requirements change.
