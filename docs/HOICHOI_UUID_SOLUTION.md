# Hoichoi UUID Extraction - Solution

## Finding: `__NEXT_DATA__` Not Found

The test revealed that `__NEXT_DATA__` script tag doesn't exist in the DOM. This means:
- The page uses **client-side rendering** (CSR) or **server-side rendering with hydration**
- Data is loaded via **API calls** after page load
- UUID is embedded in **JavaScript code** that makes API calls

## Solution: Extract UUID from API URLs in Page Source

### Approach 1: Parse HTML for API URLs (Recommended)

Since we saw API calls like:
```
https://prod-contents-api.hoichoi.dev/contents/api/v1/series?platform=WEB&language=english&contentIds=ac92dac7-371a-4bfa-8325-97fed1ad5fbc
```

We can:
1. Fetch the page HTML
2. Search for API URL patterns with `contentIds=`
3. Extract the UUID from the URL

### Implementation:

```javascript
async function extractHoichoiUuid(url) {
    try {
        // Fetch page HTML
        const response = await fetch(url);
        const html = await response.text();
        
        // Search for API URLs with contentIds parameter
        const apiUrlPattern = /prod-contents-api\.hoichoi\.dev[^"'\s]*contentIds=([0-9a-f-]{36})/gi;
        const matches = [...html.matchAll(apiUrlPattern)];
        
        if (matches.length > 0) {
            // Return the first UUID found (most likely the show UUID)
            const uuid = matches[0][1];
            log(`✅ Extracted UUID from page source: ${uuid}`);
            return uuid;
        }
        
        // Fallback: Search for any UUID pattern near "series" or "content"
        const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        const allUuids = [...new Set(html.match(uuidPattern) || [])];
        
        if (allUuids.length > 0) {
            log(`⚠️ Found ${allUuids.length} UUIDs, using first one: ${allUuids[0]}`);
            return allUuids[0];
        }
        
        throw new Error('UUID not found in page source');
        
    } catch (error) {
        log(`❌ Error extracting UUID: ${error.message}`);
        throw error;
    }
}
```

### Approach 2: Intercept Fetch Calls (Alternative)

If Approach 1 doesn't work, we can intercept fetch calls:

```javascript
// Set up before page loads or intercept existing calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('prod-contents-api.hoichoi.dev')) {
        const uuidMatch = url.match(/contentIds=([0-9a-f-]+)/);
        if (uuidMatch) {
            return uuidMatch[1]; // Store this UUID
        }
    }
    return originalFetch.apply(this, args);
};
```

### Approach 3: Use Performance API (Fallback)

```javascript
function extractUuidFromPerformanceApi() {
    const perfEntries = performance.getEntriesByType('resource');
    const apiEntries = perfEntries.filter(e => 
        e.name.includes('prod-contents-api.hoichoi.dev') &&
        e.name.includes('contentIds=')
    );
    
    if (apiEntries.length > 0) {
        const uuidMatch = apiEntries[0].name.match(/contentIds=([0-9a-f-]+)/);
        if (uuidMatch) {
            return uuidMatch[1];
        }
    }
    return null;
}
```

## Recommended Implementation Order

1. **Try Approach 1** (Parse HTML) - Most reliable, works immediately
2. **Fallback to Approach 3** (Performance API) - If HTML parsing fails
3. **Last resort: HTML scraping** - If UUID extraction completely fails

## Testing

Run the enhanced test script (`test-uuid-extraction-v2.js`) to:
1. See if UUID can be extracted from HTML source
2. Check Performance API for existing API calls
3. Set up fetch interceptor for future calls

## Next Steps

Once UUID extraction is confirmed working:
1. Implement `extractHoichoiUuid(url)` function
2. Test with multiple shows
3. Implement API call with extracted UUID
4. Parse API response and convert to TVDB format

