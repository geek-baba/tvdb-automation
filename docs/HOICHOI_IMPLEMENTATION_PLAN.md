# Hoichoi Scraper - Implementation Plan

## ✅ Phase 1 Complete: UUID Extraction Method Identified

### Confirmed UUID
- **Show UUID:** `ac92dac7-371a-4bfa-8325-97fed1ad5fbc` (for "Chill Dil")
- **Extraction Method:** Search HTML for API URLs with `contentIds=` parameter
- **Pattern:** `/\/series\?[^"'\s]*contentIds=([0-9a-f-]{36})/gi`

## Implementation Functions

### 1. Extract UUID from Hoichoi URL

```javascript
async function extractHoichoiUuid(url) {
    try {
        log(`🔍 Extracting UUID from: ${url}`);
        
        // Fetch page HTML
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Method 1: Look for series API URLs with contentIds
        const seriesApiPattern = /\/series\?[^"'\s]*contentIds=([0-9a-f-]{36})/gi;
        const seriesMatches = [...html.matchAll(seriesApiPattern)];
        
        if (seriesMatches.length > 0) {
            const uuid = seriesMatches[0][1];
            log(`✅ Extracted UUID from series API URL: ${uuid}`);
            return uuid;
        }
        
        // Method 2: Fallback - any API URL with contentIds
        const apiUrlPattern = /prod-contents-api\.hoichoi\.dev[^"'\s]*contentIds=([0-9a-f-]{36})/gi;
        const apiMatches = [...html.matchAll(apiUrlPattern)];
        
        if (apiMatches.length > 0) {
            const uuid = apiMatches[0][1];
            log(`✅ Extracted UUID from API URL: ${uuid}`);
            return uuid;
        }
        
        // Method 3: Fallback - Performance API (if page already loaded)
        const perfEntries = performance.getEntriesByType('resource');
        const apiEntries = perfEntries.filter(e => 
            e.name.includes('prod-contents-api.hoichoi.dev') &&
            e.name.includes('/series') &&
            e.name.includes('contentIds=')
        );
        
        if (apiEntries.length > 0) {
            const uuidMatch = apiEntries[0].name.match(/contentIds=([0-9a-f-]+)/);
            if (uuidMatch) {
                log(`✅ Extracted UUID from Performance API: ${uuidMatch[1]}`);
                return uuidMatch[1];
            }
        }
        
        throw new Error('Could not extract UUID from page');
        
    } catch (error) {
        log(`❌ Error extracting UUID: ${error.message}`);
        throw error;
    }
}
```

### 2. Fetch Series Data from API

```javascript
async function fetchHoichoiSeriesApi(uuid, language = 'english') {
    try {
        log(`🔍 Fetching series data from API for UUID: ${uuid}`);
        
        const apiUrl = `https://prod-contents-api.hoichoi.dev/contents/api/v1/series?platform=WEB&language=${language}&contentIds=${uuid}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.data || data.data.length === 0) {
            throw new Error('No series data returned from API');
        }
        
        log(`✅ Received series data from API`);
        return data.data[0]; // API returns array, get first item
        
    } catch (error) {
        log(`❌ Error fetching from API: ${error.message}`);
        throw error;
    }
}
```

### 3. Convert Hoichoi API Data to TVDB Format

```javascript
function convertHoichoiToTvdbFormat(apiData) {
    // Extract data from API response
    // Structure needs to be determined from actual API response
    
    return {
        name: apiData.title?.english || apiData.title?.original || '',
        originalName: apiData.title?.original || apiData.title?.english || '',
        overview: apiData.description || apiData.synopsis || '',
        year: extractYear(apiData.releaseDate || apiData.year),
        originalLanguage: mapHoichoiLanguage(apiData.language),
        genres: parseGenres(apiData.genres || apiData.tags),
        status: apiData.status || 'Ended',
        originCountry: apiData.country || [],
        imdbId: null, // Hoichoi doesn't have IMDb IDs
        homepage: '', // Will be set to Hoichoi URL
        runtime: apiData.runtime || null,
        rating: apiData.rating || null,
        isHoichoiOnly: true,
        hoichoiUrl: apiData.url || '',
        posterUrl: extractPosterUrl(apiData.images)
    };
}

function extractYear(dateString) {
    if (!dateString) return '';
    const yearMatch = dateString.match(/(\d{4})/);
    return yearMatch ? yearMatch[1] : '';
}

function mapHoichoiLanguage(lang) {
    const langMap = {
        'hindi': 'hi',
        'bengali': 'bn',
        'english': 'en',
        'tamil': 'ta',
        'telugu': 'te'
    };
    return langMap[lang?.toLowerCase()] || 'bn'; // Default to Bengali
}

function parseGenres(genres) {
    if (!genres) return [];
    if (Array.isArray(genres)) {
        return genres.map(g => typeof g === 'string' ? g : g.name || g);
    }
    if (typeof genres === 'string') {
        return genres.split('|').map(g => g.trim()).filter(Boolean);
    }
    return [];
}

function extractPosterUrl(images) {
    if (!images) return '';
    // API might have different image fields
    return images.poster || images.thumbnail || images.hero || '';
}
```

### 4. Main Fetch Function

```javascript
async function fetchHoichoiShow(url) {
    try {
        updateStatus('Fetching data from Hoichoi...');
        log(`Starting Hoichoi fetch for URL: ${url}`);
        
        // Step 1: Extract UUID
        const uuid = await extractHoichoiUuid(url);
        
        // Step 2: Fetch from API
        const apiData = await fetchHoichoiSeriesApi(uuid);
        
        // Step 3: Convert to TVDB format
        const tvdbData = convertHoichoiToTvdbFormat(apiData);
        
        // Step 4: Set official site to Hoichoi URL
        tvdbData.homepage = url;
        tvdbData.officialSite = url;
        
        // Step 5: Store data
        window.tvdbFetchedData = {
            tmdb: tvdbData,
            omdb: null,
            imdbId: null,
            tmdbId: '',
            officialSite: url,
            isHoichoiOnly: true
        };
        
        // Update context
        context.imdbId = null;
        context.tmdbId = '';
        context.originalIso1 = tvdbData.originalLanguage;
        context.step = 'step1';
        
        // Generate preview
        updatePreview(generateHoichoiPreview(tvdbData, url));
        
        updateStatus(`Hoichoi data fetched successfully!`);
        log('Hoichoi fetch completed', window.tvdbFetchedData);
        
        return tvdbData;
        
    } catch (error) {
        updateStatus(`Error fetching Hoichoi data: ${error.message}`);
        log('Error fetching Hoichoi data:', error);
        throw error;
    }
}
```

## API Issue: 400 Error

The API call is returning 400, which suggests:
- Missing required headers
- Missing authentication tokens
- Incorrect parameter format
- CORS/security restrictions

## Solution: Hybrid Approach

### Primary: HTML Scraping (More Reliable)
Since the API is giving 400 errors, we'll use HTML scraping as the primary method:
- More reliable (no API authentication needed)
- Works immediately
- Data is already in the page
- Less fragile than API (won't break if API changes)

### Fallback: API (If We Can Fix It)
- Use fetch interceptor to see actual request format
- Once we know the correct headers/parameters, use API
- API provides more complete data structure

## Next Steps

1. **Implement HTML Scraper** - Extract data directly from page HTML/DOM
2. **Implement UUID Extraction** - For future API use (if we fix it)
3. **Implement Data Conversion** - Map scraped data to TVDB format
4. **Add to Step 1 UI** - Add Hoichoi option to dropdown
5. **Test with Multiple Shows** - Verify it works for different shows
6. **Optional: Debug API** - Use interceptor to fix API approach later

## Testing Checklist

- [ ] UUID extraction works for "Chill Dil"
- [ ] UUID extraction works for other shows
- [ ] API call returns valid data
- [ ] Data conversion maps all required fields
- [ ] Step 1 form fills correctly
- [ ] Official site field is set to Hoichoi URL
- [ ] Preview displays correctly

