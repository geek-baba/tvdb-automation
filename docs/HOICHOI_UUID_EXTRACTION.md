# Hoichoi UUID Extraction Method

## Approach: Extract from Next.js `__NEXT_DATA__`

Next.js applications typically embed all page data in a `<script id="__NEXT_DATA__">` tag. This contains:
- Page props
- Query parameters
- Component data
- API responses

## Extraction Strategy

### Method 1: Parse `__NEXT_DATA__` Script Tag

```javascript
function extractUuidFromHoichoiPage(html) {
    // Find the __NEXT_DATA__ script tag
    const scriptMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    
    if (!scriptMatch) {
        throw new Error('__NEXT_DATA__ script tag not found');
    }
    
    // Parse the JSON
    const nextData = JSON.parse(scriptMatch[1]);
    
    // Navigate through the data structure to find the UUID
    // Path might be: props.pageProps.content.id or similar
    // Need to inspect actual structure
    
    return uuid;
}
```

### Method 2: Extract from API Calls in Network

If the page makes API calls, we can:
1. Intercept the API request
2. Extract UUID from the request URL or response
3. Use that UUID for subsequent API calls

### Method 3: Extract from Page URL/Route

Check if the route params contain the UUID:
- Next.js routes: `/[locale]/(withNav)/[...slug]/page`
- Slug might map to UUID in the data

## Testing Steps

1. Fetch page HTML
2. Search for `__NEXT_DATA__` script tag
3. Parse JSON structure
4. Find UUID field (likely named `id`, `contentId`, `seriesId`, etc.)
5. Test extraction with multiple shows

## Expected Data Structure

Based on Next.js patterns, the structure might be:

```json
{
  "props": {
    "pageProps": {
      "content": {
        "id": "ac92dac7-371a-4bfa-8325-97fed1ad5fbc",
        "title": "Chill Dil",
        "year": 2024,
        ...
      }
    }
  },
  "query": {
    "slug": "chill-dil-hoichoi-mini"
  }
}
```

## Implementation Code

```javascript
// Extract UUID from Hoichoi show page
async function extractHoichoiUuid(url) {
    try {
        // Fetch the page
        const response = await fetch(url);
        const html = await response.text();
        
        // Extract __NEXT_DATA__
        const scriptMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
        if (!scriptMatch) {
            throw new Error('__NEXT_DATA__ not found');
        }
        
        const nextData = JSON.parse(scriptMatch[1]);
        
        // Navigate to find UUID - structure needs to be determined
        // Possible paths:
        const uuid = 
            nextData?.props?.pageProps?.content?.id ||
            nextData?.props?.pageProps?.series?.id ||
            nextData?.props?.pageProps?.data?.id ||
            nextData?.query?.id;
        
        if (!uuid) {
            // Log structure for debugging
            console.log('Next.js data structure:', JSON.stringify(nextData, null, 2));
            throw new Error('UUID not found in expected locations');
        }
        
        return uuid;
    } catch (error) {
        console.error('Error extracting UUID:', error);
        throw error;
    }
}
```

## Fallback: HTML Scraping

If UUID extraction fails, fall back to:
1. HTML scraping for visible data
2. Or extract UUID from API calls made by the page

