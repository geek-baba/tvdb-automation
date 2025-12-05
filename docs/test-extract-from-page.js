// Alternative: Extract data from the already-loaded page
// This might be easier than calling the API directly

(function() {
    console.log('=== Extracting Data from Loaded Page ===');
    
    // Method 1: Check if data is in React state or component props
    console.log('\n=== Method 1: React Component Data ===');
    
    // Try to find React root and traverse component tree
    const reactRoot = document.querySelector('#__next') || document.body;
    console.log('React root found:', !!reactRoot);
    
    // Method 2: Look for any script tags with show data
    console.log('\n=== Method 2: Script Tags with Data ===');
    const allScripts = document.querySelectorAll('script');
    allScripts.forEach((script, index) => {
        const content = script.textContent || script.innerHTML;
        // Look for show title or description in script
        if (content.includes('Chill Dil') || content.includes('chill-dil')) {
            console.log(`Script ${index} contains show data`);
            // Try to extract JSON from script
            const jsonMatch = content.match(/\{[\s\S]{100,5000}\}/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[0]);
                    console.log('Found JSON data:', Object.keys(data));
                } catch (e) {
                    // Not valid JSON, but might have useful data
                    console.log('Contains show reference but not parseable JSON');
                }
            }
        }
    });
    
    // Method 3: Check Performance API for successful API responses
    console.log('\n=== Method 3: Performance API Responses ===');
    // Note: Performance API doesn't give us response bodies, but we can see URLs
    
    // Method 4: Try to access cached fetch responses
    console.log('\n=== Method 4: Service Worker Cache ===');
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            console.log('Service Workers:', registrations.length);
        });
    }
    
    // Method 5: Since API is giving 400, let's try HTML scraping as fallback
    console.log('\n=== Method 5: HTML Scraping (Fallback) ===');
    console.log('If API doesn\'t work, we can scrape:');
    console.log('- Title from page title or h1');
    console.log('- Description from meta tags or page content');
    console.log('- Year from metadata');
    console.log('- Genres from tags');
    console.log('- Episodes from episode list in DOM');
    
    // Quick test of HTML scraping
    const pageTitle = document.title;
    console.log('Page Title:', pageTitle);
    
    // Look for meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        console.log('Meta Description:', metaDesc.content);
    }
    
    // Look for structured data (JSON-LD)
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
        try {
            const structuredData = JSON.parse(jsonLd.textContent);
            console.log('Structured Data:', structuredData);
        } catch (e) {
            console.log('Could not parse structured data');
        }
    }
    
    console.log('\n=== Recommendation ===');
    console.log('Since API returns 400, we have two options:');
    console.log('1. Use HTML scraping (more reliable, works immediately)');
    console.log('2. Debug API call to find required headers/parameters');
    console.log('3. Use fetch interceptor to see what the page actually sends');
    
    console.log('\n=== Test Complete ===');
})();

