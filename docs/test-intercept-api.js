// Test script to intercept the actual API call the page makes
// Run this BEFORE the page loads, or refresh after running

(function() {
    console.log('=== Setting up API Interceptor ===');
    
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to intercept API calls
    window.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};
        
        // Check if it's the Hoichoi API
        if (typeof url === 'string' && url.includes('prod-contents-api.hoichoi.dev')) {
            console.log('\n🔍 Intercepted API Call:');
            console.log('URL:', url);
            console.log('Method:', options.method || 'GET');
            console.log('Headers:', options.headers);
            console.log('Body:', options.body);
            
            // Call original fetch
            return originalFetch.apply(this, args)
                .then(response => {
                    console.log('Response Status:', response.status);
                    
                    // Clone response to read body without consuming it
                    response.clone().json().then(data => {
                        console.log('Response Data:', JSON.stringify(data, null, 2));
                        
                        // If it's a series API call, show the structure
                        if (url.includes('/series')) {
                            console.log('\n=== Series API Response Structure ===');
                            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                                const series = data.data[0];
                                console.log('Series Keys:', Object.keys(series));
                                console.log('Full Series:', JSON.stringify(series, null, 2));
                            }
                        }
                    }).catch(e => {
                        console.log('Could not parse response as JSON');
                    });
                    
                    return response;
                });
        }
        
        // For non-API calls, just pass through
        return originalFetch.apply(this, args);
    };
    
    console.log('✅ Fetch interceptor installed');
    console.log('💡 Refresh the page to catch API calls');
    console.log('💡 Or navigate to a show page');
})();

