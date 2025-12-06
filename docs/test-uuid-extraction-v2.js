// Enhanced test script - Alternative approaches for UUID extraction
// Run this in browser console on a Hoichoi show page

(function() {
    console.log('=== Hoichoi UUID Extraction Test v2 ===');
    
    // Method 1: Fetch page HTML and search for UUID patterns
    console.log('\n=== Method 1: Searching page HTML for UUIDs ===');
    fetch(window.location.href)
        .then(r => r.text())
        .then(html => {
            // Look for UUID pattern in HTML
            const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
            const uuids = [...new Set(html.match(uuidPattern) || [])];
            console.log('UUIDs found in HTML:', uuids);
            
            // Look for API URLs with contentIds
            const apiUrlPattern = /prod-contents-api\.hoichoi\.dev[^"'\s]*contentIds=([0-9a-f-]+)/gi;
            const apiMatches = [...html.matchAll(apiUrlPattern)];
            if (apiMatches.length > 0) {
                console.log('✅ Found API URLs with contentIds:', apiMatches.map(m => m[1]));
                console.log('🎯 Most likely UUID:', apiMatches[0][1]);
            }
            
            // Look for __NEXT_DATA__ in raw HTML (might be there even if not in DOM)
            const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>(.*?)<\/script>/s);
            if (nextDataMatch) {
                console.log('✅ Found __NEXT_DATA__ in HTML source!');
                try {
                    const nextData = JSON.parse(nextDataMatch[1]);
                    console.log('Next.js Data:', nextData);
                } catch (e) {
                    console.log('Error parsing:', e);
                }
            }
        });
    
    // Method 2: Check Performance API for network requests
    console.log('\n=== Method 2: Checking Performance API ===');
    const perfEntries = performance.getEntriesByType('resource');
    const apiEntries = perfEntries.filter(e => 
        e.name.includes('prod-contents-api.hoichoi.dev')
    );
    console.log('API calls found:', apiEntries.map(e => e.name));
    apiEntries.forEach(entry => {
        const uuidMatch = entry.name.match(/contentIds=([0-9a-f-]+)/);
        if (uuidMatch) {
            console.log('✅ UUID from performance entry:', uuidMatch[1]);
        }
    });
    
    // Method 3: Set up fetch interceptor BEFORE page loads
    console.log('\n=== Method 3: Setting up fetch interceptor ===');
    if (!window.__hoichoiUuidExtracted) {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            if (typeof url === 'string' && url.includes('prod-contents-api.hoichoi.dev')) {
                console.log('🔍 API call intercepted:', url);
                const uuidMatch = url.match(/contentIds=([0-9a-f-]+)/);
                if (uuidMatch && !window.__hoichoiUuidExtracted) {
                    window.__hoichoiUuidExtracted = uuidMatch[1];
                    console.log('✅ UUID extracted:', uuidMatch[1]);
                    console.log('💾 Stored in window.__hoichoiUuidExtracted');
                }
            }
            return originalFetch.apply(this, args);
        };
        console.log('✅ Fetch interceptor installed');
        console.log('💡 Refresh the page to catch API calls');
    } else {
        console.log('✅ UUID already extracted:', window.__hoichoiUuidExtracted);
    }
    
    // Method 4: Try to find UUID in React component tree (if accessible)
    console.log('\n=== Method 4: Checking React DevTools data ===');
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React DevTools hook found');
        // React DevTools might have component data
    }
    
    // Method 5: Check for any global variables that might contain the data
    console.log('\n=== Method 5: Checking global variables ===');
    const globalVars = Object.keys(window).filter(k => {
        try {
            const val = window[k];
            if (typeof val === 'object' && val !== null) {
                const str = JSON.stringify(val);
                return str.includes('chill-dil') || str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
            }
        } catch (e) {}
        return false;
    });
    console.log('Global vars that might contain show data:', globalVars);
    
    console.log('\n=== Test Complete ===');
    console.log('\n📋 Next Steps:');
    console.log('1. Check the "Method 1" results above (from HTML fetch)');
    console.log('2. Refresh page to trigger fetch interceptor');
    console.log('3. Check window.__hoichoiUuidExtracted after refresh');
})();

