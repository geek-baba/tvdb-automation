# API Reference

This document provides detailed information about the APIs and functions used in the TVDB Workflow Automation script.

## Table of Contents

- [External APIs](#external-apis)
- [Internal Functions](#internal-functions)
- [Configuration](#configuration)
- [Data Structures](#data-structures)
- [Event Handlers](#event-handlers)

## External APIs

### TMDB (The Movie Database) API

**Base URL**: `https://api.themoviedb.org/3`

#### TV Series Information
```javascript
GET /tv/{series_id}?api_key={api_key}&language={language}
```

**Parameters:**
- `series_id`: TMDB TV series ID (e.g., 277489)
- `api_key`: Your TMDB API key
- `language`: Language code (e.g., 'en-US', 'te')

**Response Fields Used:**
- `name`: English series name
- `original_name`: Original series name
- `overview`: Series description
- `original_language`: Original language code
- `first_air_date`: First air date
- `genres`: Array of genre objects
- `homepage`: Official website URL
- `external_ids.imdb_id`: IMDb ID

#### TV Series Images
```javascript
GET /tv/{series_id}/images?api_key={api_key}
```

**Response Fields Used:**
- `posters`: Array of poster objects
  - `file_path`: Image path
  - `vote_average`: Quality rating
  - `vote_count`: Number of votes
  - `width`: Image width
  - `height`: Image height
  - `iso_639_1`: Language code

#### TV Series Episodes
```javascript
GET /tv/{series_id}/season/{season_number}?api_key={api_key}&language={language}
```

**Parameters:**
- `series_id`: TMDB TV series ID
- `season_number`: Season number (e.g., 1)
- `api_key`: Your TMDB API key
- `language`: Language code

**Response Fields Used:**
- `episodes`: Array of episode objects
  - `episode_number`: Episode number
  - `name`: Episode title
  - `overview`: Episode description
  - `air_date`: Air date
  - `runtime`: Episode duration
  - `still_path`: Episode image path

### OMDb API

**Base URL**: `https://www.omdbapi.com`

#### Series Information
```javascript
GET /?i={imdb_id}&apikey={api_key}
```

**Parameters:**
- `imdb_id`: IMDb ID (e.g., tt32047599)
- `api_key`: Your OMDb API key

**Response Fields Used:**
- `Title`: Series title
- `Plot`: Series description
- `Poster`: Poster image URL
- `Language`: Language information
- `Year`: Release year

#### Season Information
```javascript
GET /?i={imdb_id}&Season={season_number}&apikey={api_key}
```

**Parameters:**
- `imdb_id`: IMDb ID
- `season_number`: Season number
- `api_key`: Your OMDb API key

**Response Fields Used:**
- `Episodes`: Array of episode objects
  - `Episode`: Episode number
  - `Title`: Episode title
  - `Plot`: Episode description
  - `Released`: Air date

## Internal Functions

### Core Workflow Functions

#### `fetchData(tmdbId)`
Fetches series data from TMDB and OMDb APIs.

**Parameters:**
- `tmdbId` (string): TMDB TV series ID

**Returns:** Promise that resolves to series data object

**Data Structure:**
```javascript
{
  tmdb: {
    name: "Series Name",
    originalName: "Original Series Name",
    overview: "Series description",
    originalLanguage: "te",
    year: 2024,
    genres: [...],
    homepage: "https://example.com"
  },
  omdb: {
    Title: "Series Title",
    Plot: "Series plot",
    Poster: "https://example.com/poster.jpg",
    Language: "Telugu"
  },
  imdbId: "tt32047599"
}
```

#### `applyStep1()`
Fills Step 1 (Create Show) form fields.

**Fields Filled:**
- IMDb ID field
- TMDB ID field
- Official Site field

#### `applyStep2()`
Fills Step 2 (Add Series) form fields.

**Fields Filled:**
- Series name (original language)
- Series overview
- Original language
- Original country
- Status
- Genres

#### `applyStep3()`
Fills Step 3 (Bulk Add Episodes) form fields.

**Process:**
1. Creates episode forms by clicking "Add Another"
2. Fills each episode with:
   - Episode number
   - Episode name
   - Episode description
   - Air date
   - Runtime

#### `applyStep4()`
Fills Step 4 (Upload Poster) form fields.

**Fields Filled:**
- Poster URL field
- Language field

#### `applyStep5()`
Fills Step 5 (English Translation) form fields.

**Fields Filled:**
- Series name (English)
- Series overview (English)
- Episode names (English)
- Episode descriptions (English)

### Utility Functions

#### `fillField(field, value)`
Fills a form field with human-like behavior.

**Parameters:**
- `field` (HTMLElement): Form field element
- `value` (string): Value to fill

**Features:**
- Human-like typing simulation
- Event triggering (input, change, blur)
- Error handling

#### `findFormField(labelText)`
Finds form fields using multiple strategies.

**Parameters:**
- `labelText` (string): Label text to search for

**Strategies:**
1. Label `for` attribute
2. Adjacent element search
3. Placeholder text matching
4. Name attribute matching
5. ID attribute matching
6. Data attribute matching
7. TVDB-specific patterns

#### `mapLanguageCode(tmdbCode)`
Maps TMDB language codes to TVDB format.

**Parameters:**
- `tmdbCode` (string): TMDB language code (e.g., 'te')

**Returns:** TVDB language code (e.g., 'tel')

**Mapping Examples:**
- 'en' → 'eng'
- 'te' → 'tel'
- 'hi' → 'hin'
- 'ta' → 'tam'

### Data Management Functions

#### `saveConfig()`
Saves configuration to browser storage.

**Data Saved:**
- TMDB API key
- OMDb API key
- User preferences

#### `loadConfig()`
Loads configuration from browser storage.

**Returns:** Configuration object

#### `updateStatus(message)`
Updates the status display in the helper panel.

**Parameters:**
- `message` (string): Status message to display

## Configuration

### API Keys

#### TMDB API Key
- **Required**: Yes
- **Purpose**: Fetch series and episode data
- **Storage**: Browser storage (encrypted)
- **Format**: String (32 characters)

#### OMDb API Key
- **Required**: Yes
- **Purpose**: Fallback data and additional metadata
- **Storage**: Browser storage (encrypted)
- **Format**: String (8 characters)

### User Preferences

#### Stealth Mode
- **Default**: false
- **Purpose**: Hide helper panel to avoid detection
- **Toggle**: Ctrl+Alt+S or UI button

#### Debug Logging
- **Default**: true
- **Purpose**: Enable detailed console logging
- **Location**: Browser console (F12)

#### Language Mapping
- **Default**: Automatic
- **Purpose**: Convert TMDB language codes to TVDB format
- **Customization**: Modify LANGUAGE_MAP object

## Data Structures

### Series Data Object
```javascript
{
  tmdbId: "277489",
  imdbId: "tt32047599",
  tmdb: {
    name: "Vikkatakavi",
    originalName: "వికటకవి",
    overview: "Series description...",
    originalLanguage: "te",
    year: 2024,
    genres: [
      { id: 18, name: "Drama" },
      { id: 80, name: "Crime" }
    ],
    homepage: "https://www.zee5.com/..."
  },
  omdb: {
    Title: "Vikkatakavi",
    Plot: "Series plot...",
    Poster: "https://m.media-amazon.com/...",
    Language: "Telugu",
    Year: "2024"
  }
}
```

### Episode Data Object
```javascript
{
  episodes: [
    {
      episodeNumber: 1,
      name: "Episode Title",
      overview: "Episode description...",
      airDate: "2024-01-01",
      runtime: 45,
      stillPath: "/path/to/image.jpg",
      descriptionSource: "TMDB"
    }
  ]
}
```

### Poster Data Object
```javascript
{
  posters: [
    {
      file_path: "/path/to/poster.jpg",
      vote_average: 7.5,
      vote_count: 100,
      width: 2000,
      height: 3000,
      iso_639_1: "en"
    }
  ],
  selectedPoster: { /* selected poster object */ }
}
```

## Event Handlers

### Button Click Handlers

#### Fetch Data Button
```javascript
document.getElementById('tvdb-fetch-data').onclick = fetchData;
```

#### Apply Button
```javascript
document.getElementById('tvdb-apply').onclick = applyStep;
```

#### Apply & Continue Button
```javascript
document.getElementById('tvdb-apply-continue').onclick = applyAndContinue;
```

### Keyboard Shortcuts

#### Stealth Mode Toggle
```javascript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key === 's') {
    toggleStealthMode();
  }
});
```

#### Show Panel
```javascript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key === 't') {
    showPanel();
  }
});
```

## Error Handling

### API Errors
- **Network Errors**: Automatic retry with exponential backoff
- **Rate Limiting**: Respects API rate limits
- **Invalid Responses**: Fallback to alternative data sources

### Form Errors
- **Field Not Found**: Multiple fallback strategies
- **Validation Errors**: User notification and manual override
- **Submission Errors**: Retry mechanism and error reporting

### User Errors
- **Invalid Input**: Input validation and error messages
- **Missing Data**: Clear error messages and guidance
- **Configuration Issues**: Setup wizard and validation

## Performance Considerations

### API Optimization
- **Caching**: Stores fetched data to avoid redundant API calls
- **Batch Requests**: Groups related API calls when possible
- **Rate Limiting**: Respects API rate limits and implements delays

### DOM Optimization
- **Efficient Selectors**: Uses most efficient CSS selectors
- **Event Delegation**: Minimizes event listener overhead
- **Lazy Loading**: Loads data only when needed

### Memory Management
- **Data Cleanup**: Clears unused data from memory
- **Event Cleanup**: Removes event listeners when not needed
- **Storage Management**: Efficient use of browser storage