# API Reference

## TMDB API

### Base URL
```
https://api.themoviedb.org/3
```

### Authentication
All requests require an API key passed as a query parameter:
```
?api_key=YOUR_API_KEY
```

### Endpoints Used

#### Get TV Series Details
```
GET /tv/{tv_id}?api_key={api_key}&append_to_response=external_ids,images,translations
```

**Parameters:**
- `tv_id` (required): The TV series ID
- `append_to_response`: Comma-separated list of sub-objects to include

**Response Structure:**
```json
{
  "id": 12345,
  "name": "Series Name",
  "original_name": "Original Name",
  "overview": "Series overview...",
  "original_language": "ja",
  "origin_country": ["JP"],
  "status": "Returning Series",
  "genres": [{"id": 16, "name": "Animation"}],
  "episode_run_time": [24],
  "homepage": "https://example.com",
  "external_ids": {
    "imdb_id": "tt1234567"
  },
  "images": {
    "posters": [...]
  },
  "translations": {
    "translations": [...]
  }
}
```

#### Get Season Details
```
GET /tv/{tv_id}/season/{season_number}?api_key={api_key}
```

**Parameters:**
- `tv_id` (required): The TV series ID
- `season_number` (required): The season number (0 for specials)

**Response Structure:**
```json
{
  "id": 123456,
  "name": "Season 1",
  "overview": "Season overview...",
  "season_number": 1,
  "episodes": [
    {
      "id": 789,
      "name": "Episode Name",
      "overview": "Episode overview...",
      "episode_number": 1,
      "air_date": "2020-01-01",
      "runtime": 24
    }
  ]
}
```

### Important Fields

#### Status Mapping
| TMDB Status | TVDB Status |
|------------|-------------|
| Returning Series | Continuing |
| Ended, Canceled | Ended |
| Planned, In Production, Upcoming | Upcoming |

#### Genre Mapping
Requires a mapping table from TMDB genre IDs to TVDB genre names.
Common mappings:
- Animation → Animation
- Comedy → Comedy
- Drama → Drama
- Documentary → Documentary
- etc.

#### Language Code Mapping
ISO-639-1 → ISO-639-2 mapping required:
| ISO-639-1 | ISO-639-2 | Language |
|-----------|-----------|----------|
| en | eng | English |
| ja | jpn | Japanese |
| ko | kor | Korean |
| zh | zho | Chinese |
| es | spa | Spanish |
| etc. | | |

---

## OMDb API

### Base URL
```
https://www.omdbapi.com
```

### Authentication
API key passed as a query parameter:
```
?apikey=YOUR_API_KEY
```

### Endpoints Used

#### Get by IMDb ID
```
GET /?apikey={api_key}&i={imdb_id}&type=series
```

**Parameters:**
- `apikey` (required): Your OMDb API key
- `i` (required): IMDb ID (with or without "tt" prefix)
- `type`: Restrict to series type

**Response Structure:**
```json
{
  "Title": "Series Title",
  "Year": "2020",
  "Language": "Japanese, English",
  "totalSeasons": "1",
  "Response": "True"
}
```

### Rate Limits
- Free tier: 1,000 requests/day
- Paid tiers: Higher limits available

---

## Data Extraction Guide

### Step 1: Create Show
```javascript
{
  imdbId: tmdbData.external_ids.imdb_id,
  tmdbId: tmdbData.id.toString(),
  officialSite: tmdbData.homepage
}
```

### Step 2: Add Series
```javascript
{
  originalLanguage: mapIso6391to2(tmdbData.original_language),
  name: getTranslation(tmdbData, 'name', originalLanguage),
  overview: getTranslation(tmdbData, 'overview', originalLanguage),
  country: tmdbData.origin_country[0],
  status: mapStatus(tmdbData.status),
  genres: mapGenres(tmdbData.genres)
}
```

### Step 3: Bulk Add Episodes
```javascript
seasonData.episodes.map(episode => ({
  number: episode.episode_number,
  name: episode.name,
  overview: episode.overview,
  firstAired: formatDate(episode.air_date),
  runtime: episode.runtime || seasonAverage || seriesDefault
}))
```

### Step 4: Upload Poster
```javascript
{
  posterUrl: getBestPoster(tmdbData.images.posters),
  language: posterLanguage || originalLanguage
}
```

### Step 5: English Translation
```javascript
{
  englishTitle: getTranslation(tmdbData, 'name', 'en'),
  englishOverview: getTranslation(tmdbData, 'overview', 'en')
}
```

---

## Helper Functions Reference

### Date Formatting
```javascript
function formatDate(isoDate) {
  // TMDB: YYYY-MM-DD
  // TVDB: MM/DD/YYYY
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}
```

### Translation Lookup
```javascript
function getTranslation(data, field, language) {
  const translation = data.translations.translations.find(
    t => t.iso_639_1 === language
  );
  
  if (translation && translation.data[field]) {
    return translation.data[field];
  }
  
  // Fallback to original
  return data[`original_${field}`] || data[field];
}
```

### Best Poster Selection
```javascript
function getBestPoster(posters) {
  // Prefer high resolution, English language
  const english = posters.find(p => p.iso_639_1 === 'en');
  if (english) return imageBaseUrl + english.file_path;
  
  // Fallback to first poster
  return imageBaseUrl + posters[0].file_path;
}
```

### Runtime Fallback Chain
```javascript
function getRuntime(episode, season, series) {
  return episode.runtime 
    || season.averageEpisodeRuntime 
    || series.episode_run_time[0]
    || 0;
}
```

---

## Error Handling

### Common Errors

#### 401 Unauthorized
- **Cause**: Invalid or missing API key
- **Solution**: Verify API key is correct

#### 404 Not Found
- **Cause**: Invalid TMDB ID or resource not found
- **Solution**: Check TMDB ID is correct

#### 429 Too Many Requests
- **Cause**: Rate limit exceeded
- **Solution**: Implement exponential backoff, reduce request frequency

#### Network Errors
- **Cause**: Connection issues
- **Solution**: Retry with backoff, show user-friendly message

### Error Response Structure
```json
{
  "status_code": 7,
  "status_message": "Invalid API key"
}
```

---

## Rate Limits

### TMDB
- Free tier: ~40 requests/10 seconds
- Should implement request throttling

### OMDb
- Free tier: 1,000 requests/day
- Should track daily usage

### Best Practices
1. Cache API responses where possible
2. Batch requests when feasible
3. Implement exponential backoff
4. Show rate limit status to user
5. Queue requests if limit is approached

---

## Sample Request Flow

### Complete Workflow

```javascript
// 1. Fetch TV series data
const seriesResponse = await fetch(
  `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&append_to_response=external_ids,images,translations`
);
const seriesData = await seriesResponse.json();

// 2. Extract IMDb ID
const imdbId = seriesData.external_ids.imdb_id;

// 3. Fetch OMDb data (optional)
const omdbResponse = await fetch(
  `https://www.omdbapi.com/?apikey=${omdbKey}&i=${imdbId}&type=series`
);
const omdbData = await omdbResponse.json();

// 4. Fetch season data
const seasonResponse = await fetch(
  `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${apiKey}`
);
const seasonData = await seasonResponse.json();

// 5. Process and map data
const processedData = {
  series: processSeriesData(seriesData),
  season: processSeasonData(seasonData),
  omdb: processOmdbData(omdbData)
};
```

---

## Additional Resources

### Official Documentation
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [OMDb API Documentation](http://www.omdbapi.com/)

### API Status
- TMDB: Generally stable, rare outages
- OMDb: Generally stable, free tier has daily limits

### Support
- TMDB: [Community Forum](https://www.themoviedb.org/talk)
- OMDb: [Support Email](http://www.omdbapi.com/)
