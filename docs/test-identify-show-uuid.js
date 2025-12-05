// Test script to identify the correct show UUID from the 25 found
// Run this in browser console on a Hoichoi show page

(async function() {
    console.log('=== Identifying Show UUID ===');
    
    // Fetch page HTML
    const html = await fetch(window.location.href).then(r => r.text());
    
    // Method 1: Look for API URLs with contentIds parameter
    console.log('\n=== Method 1: API URLs with contentIds ===');
    const apiUrlPatterns = [
        /prod-contents-api\.hoichoi\.dev[^"'\s]*contentIds=([0-9a-f-]{36})/gi,
        /contentIds=([0-9a-f-]{36})/gi,
        /["']([0-9a-f-]{36})["'][^"']*series/gi,
        /series[^"']*["']([0-9a-f-]{36})["']/gi,
    ];
    
    let foundUuids = [];
    apiUrlPatterns.forEach((pattern, index) => {
        const matches = [...html.matchAll(pattern)];
        if (matches.length > 0) {
            console.log(`Pattern ${index + 1} found:`, matches.map(m => m[1]));
            foundUuids.push(...matches.map(m => m[1]));
        }
    });
    
    const uniqueApiUuids = [...new Set(foundUuids)];
    console.log('✅ UUIDs found in API URLs:', uniqueApiUuids);
    
    // Method 2: Check Performance API for actual API calls
    console.log('\n=== Method 2: Performance API ===');
    const perfEntries = performance.getEntriesByType('resource');
    const apiEntries = perfEntries.filter(e => 
        e.name.includes('prod-contents-api.hoichoi.dev') &&
        e.name.includes('series')
    );
    
    console.log('Series API calls found:', apiEntries.length);
    apiEntries.forEach((entry, index) => {
        console.log(`  Call ${index + 1}:`, entry.name);
        const uuidMatch = entry.name.match(/contentIds=([0-9a-f-]+)/);
        if (uuidMatch) {
            console.log(`  ✅ UUID: ${uuidMatch[1]}`);
        }
    });
    
    // Method 3: Look for the UUID near "chill-dil" or show slug
    console.log('\n=== Method 3: UUID near show slug ===');
    const urlSlug = window.location.pathname.match(/\/shows\/([^\/]+)/)?.[1];
    console.log('URL Slug:', urlSlug);
    
    if (urlSlug) {
        // Find UUIDs that appear near the slug in the HTML
        const slugIndex = html.indexOf(urlSlug);
        if (slugIndex !== -1) {
            // Look for UUIDs within 500 characters of the slug
            const context = html.substring(Math.max(0, slugIndex - 250), slugIndex + 250);
            const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
            const nearbyUuids = [...new Set(context.match(uuidPattern) || [])];
            console.log('UUIDs near slug:', nearbyUuids);
        }
    }
    
    // Method 4: Check which UUID appears in series API calls specifically
    console.log('\n=== Method 4: Series API specific ===');
    const seriesApiPattern = /\/series\?[^"'\s]*contentIds=([0-9a-f-]{36})/gi;
    const seriesMatches = [...html.matchAll(seriesApiPattern)];
    if (seriesMatches.length > 0) {
        console.log('✅ UUIDs in /series API calls:', seriesMatches.map(m => m[1]));
        console.log('🎯 Most likely show UUID:', seriesMatches[0][1]);
    }
    
    // Final recommendation
    console.log('\n=== RECOMMENDATION ===');
    if (uniqueApiUuids.length > 0) {
        console.log(`✅ Use UUID: ${uniqueApiUuids[0]}`);
        console.log('This UUID appears in API URLs with contentIds parameter');
    } else if (apiEntries.length > 0) {
        const perfUuid = apiEntries[0].name.match(/contentIds=([0-9a-f-]+)/)?.[1];
        if (perfUuid) {
            console.log(`✅ Use UUID: ${perfUuid}`);
            console.log('This UUID was found in actual API call from Performance API');
        }
    } else {
        console.log('⚠️ Could not definitively identify show UUID');
        console.log('May need to use first UUID from list or try API call with each UUID');
    }
    
    console.log('\n=== Test Complete ===');
})();

