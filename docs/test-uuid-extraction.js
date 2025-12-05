// Test script to extract UUID from Hoichoi show page
// Run this in browser console on a Hoichoi show page

(function() {
    console.log('=== Hoichoi UUID Extraction Test ===');
    
    // Method 1: Check if __NEXT_DATA__ exists in DOM
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript) {
        console.log('✅ Found __NEXT_DATA__ script tag');
        try {
            const nextData = JSON.parse(nextDataScript.textContent);
            console.log('Next.js Data Structure:', nextData);
            
            // Try common paths for UUID
            const possiblePaths = [
                nextData?.props?.pageProps?.content?.id,
                nextData?.props?.pageProps?.series?.id,
                nextData?.props?.pageProps?.data?.id,
                nextData?.props?.pageProps?.show?.id,
                nextData?.query?.id,
                nextData?.props?.pageProps?.params?.id,
            ];
            
            console.log('Possible UUIDs found:', possiblePaths.filter(Boolean));
            
            // Also check the full structure
            console.log('Full props structure:', JSON.stringify(nextData.props, null, 2));
            
        } catch (e) {
            console.error('Error parsing __NEXT_DATA__:', e);
        }
    } else {
        console.log('❌ __NEXT_DATA__ script tag not found');
    }
    
    // Method 2: Check window object for embedded data
    console.log('\n=== Checking window object ===');
    if (window.__NEXT_DATA__) {
        console.log('✅ Found window.__NEXT_DATA__');
        console.log('Data:', window.__NEXT_DATA__);
    }
    
    // Method 3: Check for API calls in network (if we can intercept)
    console.log('\n=== Checking for API-related data ===');
    
    // Look for any data attributes or meta tags
    const metaTags = document.querySelectorAll('meta[property], meta[name]');
    console.log('Meta tags:', Array.from(metaTags).map(m => ({
        property: m.getAttribute('property') || m.getAttribute('name'),
        content: m.getAttribute('content')
    })));
    
    // Method 4: Check URL structure
    console.log('\n=== URL Analysis ===');
    const url = window.location.href;
    const urlMatch = url.match(/\/shows\/([^\/]+)/);
    if (urlMatch) {
        console.log('URL Slug:', urlMatch[1]);
    }
    
    // Method 5: Check for any script tags with JSON data
    console.log('\n=== Checking all script tags ===');
    const allScripts = document.querySelectorAll('script[type="application/json"]');
    allScripts.forEach((script, index) => {
        console.log(`Script ${index}:`, script.id || 'no-id', script.textContent.substring(0, 200));
    });
    
    // Method 6: Check ALL script tags for UUID patterns
    console.log('\n=== Checking ALL script tags for UUIDs ===');
    const allScriptTags = document.querySelectorAll('script');
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    allScriptTags.forEach((script, index) => {
        const content = script.textContent || script.innerHTML;
        const uuids = content.match(uuidPattern);
        if (uuids && uuids.length > 0) {
            console.log(`Script ${index} (${script.id || 'no-id'}): Found UUIDs:`, [...new Set(uuids)]);
            // Show context around first UUID
            const uuidIndex = content.indexOf(uuids[0]);
            const context = content.substring(Math.max(0, uuidIndex - 100), uuidIndex + 200);
            console.log('Context:', context);
        }
    });
    
    // Method 7: Check for React/Next.js state in window
    console.log('\n=== Checking window object for React/Next.js state ===');
    const windowKeys = Object.keys(window).filter(k => 
        k.includes('NEXT') || 
        k.includes('REACT') || 
        k.includes('__') ||
        k.toLowerCase().includes('hoichoi')
    );
    console.log('Relevant window keys:', windowKeys);
    windowKeys.forEach(key => {
        try {
            const value = window[key];
            if (typeof value === 'object' && value !== null) {
                console.log(`window.${key}:`, JSON.stringify(value).substring(0, 500));
            }
        } catch (e) {
            console.log(`window.${key}: [Error accessing]`);
        }
    });
    
    // Method 8: Check for data attributes on body/html
    console.log('\n=== Checking data attributes ===');
    const bodyDataAttrs = Array.from(document.body.attributes)
        .filter(attr => attr.name.startsWith('data-'));
    const htmlDataAttrs = Array.from(document.documentElement.attributes)
        .filter(attr => attr.name.startsWith('data-'));
    console.log('Body data attributes:', bodyDataAttrs.map(a => `${a.name}="${a.value}"`));
    console.log('HTML data attributes:', htmlDataAttrs.map(a => `${a.name}="${a.value}"`));
    
    // Method 9: Try to find API calls in fetch/XHR intercept
    console.log('\n=== Checking for API URLs in page ===');
    // Look for API URLs in script content
    const apiUrlPattern = /prod-contents-api\.hoichoi\.dev[^"'\s]*contentIds=([0-9a-f-]+)/gi;
    allScriptTags.forEach((script, index) => {
        const content = script.textContent || script.innerHTML;
        const matches = [...content.matchAll(apiUrlPattern)];
        if (matches.length > 0) {
            console.log(`Script ${index}: Found API URLs with contentIds:`, matches.map(m => m[1]));
        }
    });
    
    // Method 10: Check if we can access the API response from network
    console.log('\n=== Attempting to intercept API calls ===');
    // This won't work retroactively, but we can set up interception for future calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('prod-contents-api.hoichoi.dev')) {
            console.log('🔍 Intercepted API call:', url);
            // Extract UUID from URL
            const uuidMatch = url.match(/contentIds=([0-9a-f-]+)/);
            if (uuidMatch) {
                console.log('✅ Found UUID in API URL:', uuidMatch[1]);
            }
        }
        return originalFetch.apply(this, args);
    };
    console.log('✅ Fetch interceptor installed (will catch future API calls)');
    
    console.log('\n=== Test Complete ===');
    console.log('\n💡 TIP: Try navigating to the page again or refreshing to trigger API calls');
})();

