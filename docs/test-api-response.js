// Test script to see the actual API response structure
// Run this in browser console on a Hoichoi show page

(async function() {
    console.log('=== Testing Hoichoi API Response ===');
    
    // Known UUID from "Chill Dil"
    const uuid = 'ac92dac7-371a-4bfa-8325-97fed1ad5fbc';
    
    // Test API call
    const apiUrl = `https://prod-contents-api.hoichoi.dev/contents/api/v1/series?platform=WEB&language=english&contentIds=${uuid}`;
    
    console.log('API URL:', apiUrl);
    console.log('Fetching...\n');
    
    try {
        // Try with headers that might be required
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': window.location.href,
            'Origin': window.location.origin
        };
        
        console.log('Trying with headers:', headers);
        let response = await fetch(apiUrl, { headers });
        console.log('Response Status:', response.status, response.statusText);
        
        // If still 400, try to get error details
        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error Response:', errorText);
            
            // Try without language parameter
            console.log('\n=== Trying without language parameter ===');
            const apiUrlNoLang = `https://prod-contents-api.hoichoi.dev/contents/api/v1/series?platform=WEB&contentIds=${uuid}`;
            response = await fetch(apiUrlNoLang, { headers });
            console.log('Response Status (no lang):', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText2 = await response.text();
                console.log('Error Response (no lang):', errorText2);
            }
        }
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('\n=== Full API Response ===');
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\n=== Response Structure ===');
        console.log('Top-level keys:', Object.keys(data));
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            const series = data.data[0];
            console.log('\n=== Series Object Keys ===');
            console.log(Object.keys(series));
            
            console.log('\n=== Key Fields ===');
            console.log('Title:', series.title);
            console.log('Description:', series.description || series.synopsis);
            console.log('Year:', series.year || series.releaseDate);
            console.log('Language:', series.language);
            console.log('Genres:', series.genres || series.tags);
            console.log('Images:', series.images);
            console.log('Episodes:', series.episodes);
            
            // Show full series object
            console.log('\n=== Full Series Object ===');
            console.log(JSON.stringify(series, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    console.log('\n=== Test Complete ===');
})();

