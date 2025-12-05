# Hoichoi.tv Scraper - Phase 1 Analysis

## Site Structure Analysis
**Date:** 2025-12-05  
**Test URL:** https://www.hoichoi.tv/shows/chill-dil-hoichoi-mini

---

## Key Findings

### 1. Technology Stack
- **Framework:** Next.js (React-based)
- **API:** Uses `prod-contents-api.hoichoi.dev` for data
- **CDN:** `image.hoichoicdn.com` for images
- **Rendering:** Client-side rendered (dynamic content)

### 2. Data Available on Show Page

From visual inspection and network analysis:

#### Show Metadata:
- **Title:** "Chill Dil" (English) + "(Hindi)" language indicator
- **Year:** 2024
- **Rating/Certification:** "U"
- **Seasons:** "1 Season"
- **Genres:** "Romantic | Comedy" (pipe-separated)
- **Description:** "Our lives are full of adventure, love, and unexpected twists and turns. Watch the chilling-out stories of some clueless souls."
- **Language:** Hindi (shown in parentheses)
- **Poster/Artwork:** Composite image with 4 character scenes

#### Episode Data:
- Episode list visible in Season 1 section
- Each episode shows:
  - Episode number (S1 E1, S1 E2, etc.)
  - Title (e.g., "Kiraaye Ka Ki a", "Online Shaadi")
  - Duration (e.g., "9m")
  - Language (Hindi)
  - Description snippet (truncated)

### 3. API Endpoints Discovered

#### Series API:
```
https://prod-contents-api.hoichoi.dev/contents/api/v1/series
?platform=WEB
&language=english
&contentIds=<uuid>
```

**Note:** The API uses UUIDs, not the slug from the URL. We'll need to:
1. Extract UUID from page source/API calls, OR
2. Scrape HTML directly

#### People API:
```
https://prod-contents-api.hoichoi.dev/contents/api/v1/people
?platform=WEB
&language=english
&personIds=<uuid>
```

### 4. URL Structure
- **Pattern:** `https://www.hoichoi.tv/shows/{slug}`
- **Example:** `chill-dil-hoichoi-mini`
- **Note:** Slug may not directly map to API UUID

---

## Scraping Strategy Options

### Option A: HTML Scraping (Recommended for MVP)
**Pros:**
- Works immediately without reverse-engineering API
- No need to find UUID mapping
- Direct access to visible data

**Cons:**
- Fragile if HTML structure changes
- May miss some metadata
- Need to handle dynamic content loading

**Implementation:**
- Use `fetch()` to get HTML
- Parse with `DOMParser`
- Extract via CSS selectors
- Wait for dynamic content if needed

### Option B: API Scraping (Future Enhancement)
**Pros:**
- More reliable
- Complete data structure
- Faster

**Cons:**
- Need to find UUID from slug
- May require authentication
- API structure may change

**Implementation:**
- Extract UUID from page source (likely in `<script>` tags or API calls)
- Call series API directly
- Parse JSON response

---

## Data Extraction Plan

### Fields to Extract:

#### Step 1 (Create Show):
1. **Title (English):** "Chill Dil"
2. **Original Title:** May need to check for Bengali title
3. **Year:** "2024"
4. **Description/Overview:** Full description text
5. **Genres:** Parse "Romantic | Comedy" → ["Romantic", "Comedy"]
6. **Language:** Detect from page (Hindi = "hi", Bengali = "bn")
7. **Official Site:** The Hoichoi URL itself
8. **Poster URL:** Extract from image CDN

#### Step 3 (Episodes):
1. **Episode Number:** S1 E1 → 1
2. **Episode Title:** "Kiraaye Ka Ki a"
3. **Air Date:** May not be available (check)
4. **Description:** Full episode description
5. **Runtime:** "9m" → 9 minutes

---

## CSS Selector Strategy (HTML Scraping)

Based on accessibility snapshot and visual inspection:

### Title:
- Look for main heading with show name
- May be in `<h1>` or similar
- Check for language indicator "(Hindi)" to separate

### Metadata:
- "U • 1 Season • 2024 • Romantic | Comedy"
- Likely in a metadata section
- Parse pipe-separated values

### Description:
- Full text description
- May be in expandable section
- Look for description/plot area

### Episodes:
- Season section with episode list
- Each episode as button/card
- Extract episode number, title, description

### Poster:
- Main hero image
- CDN URL: `image.hoichoicdn.com`
- Extract highest resolution available

---

## Challenges Identified

1. **Dynamic Content:** Next.js app loads content dynamically
   - **Solution:** Wait for content with `MutationObserver` or timeout

2. **UUID Mapping:** API uses UUIDs, URL uses slugs
   - **Solution:** Start with HTML scraping, extract UUID later if needed

3. **Language Detection:** Multiple languages possible
   - **Solution:** Check language indicator in title/metadata

4. **Genre Format:** Pipe-separated string
   - **Solution:** Split by "|" and trim

5. **Episode Descriptions:** May be truncated
   - **Solution:** Click "expand" if available, or scrape full description from episode page

---

## API Approach (Recommended)

### UUID Extraction Strategy
1. **Fetch page HTML** - Get the full page source
2. **Extract `__NEXT_DATA__`** - Next.js embeds all data here
3. **Parse JSON** - Find UUID in the data structure
4. **Call API** - Use UUID to fetch complete data from API
5. **Fallback** - If UUID extraction fails, use HTML scraping

### API Endpoint Structure
```
GET https://prod-contents-api.hoichoi.dev/contents/api/v1/series
?platform=WEB
&language=english
&contentIds={uuid}
```

### Implementation Flow
```javascript
async function fetchHoichoiShow(url) {
    // 1. Extract UUID from page
    const uuid = await extractUuidFromPage(url);
    
    // 2. Call API with UUID
    const apiData = await fetchSeriesFromApi(uuid);
    
    // 3. Convert to TVDB format
    return convertApiToTvdbFormat(apiData);
}
```

## Next Steps

### Phase 2A: UUID Extraction
1. Create `extractHoichoiUuid(url)` function
2. Parse `__NEXT_DATA__` script tag
3. Navigate JSON structure to find UUID
4. Test with multiple shows
5. Add fallback if UUID not found

### Phase 2B: API Integration
1. Create `fetchHoichoiSeriesApi(uuid)` function
2. Handle API response structure
3. Extract all required fields
4. Handle multiple languages if needed

### Phase 2C: Data Conversion
1. Create `convertHoichoiToTvdbFormat(apiData)` function
2. Map API fields to TVDB format
3. Handle missing fields gracefully

### Phase 3: Integration
1. Add "Hoichoi" option to Step 1 data source dropdown
2. Connect scraper to fetch button
3. Fill form with scraped data
4. Set official site field to Hoichoi URL

---

## Test Cases

### Test Show 1: Chill Dil
- URL: `https://www.hoichoi.tv/shows/chill-dil-hoichoi-mini`
- Language: Hindi
- Year: 2024
- Genres: Romantic, Comedy

### Test Show 2: (To be identified)
- Bengali show for language testing
- Different genre combinations
- Different year

### Test Show 3: (To be identified)
- Multi-season show (if available)
- More episodes for testing

---

## Notes

- Site uses Cloudflare (may have anti-scraping measures)
- No authentication required for viewing show pages
- API calls use CORS (may need to handle in userscript)
- Images use CDN with URL parameters for sizing/format

