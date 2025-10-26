# TVDB Automation Architecture

## Overview

The TVDB Automation system is a single Tampermonkey userscript that automates TheTVDB's submission workflow by integrating with TMDB and OMDb APIs.

## System Components

### 1. Core Script
- **File:** `src/tvdb-workflow-helper.user.js`
- **Purpose:** Main entry point and orchestration layer
- **Responsibilities:**
  - UI panel management
  - State machine coordination
  - Page detection and routing
  - Event handling

### 2. Data Layer

#### API Clients
- **TMDB Client**: Primary data source
  - TV series information
  - Episode details
  - Translations
  - Images (posters)
- **OMDb Client**: Fallback data source
  - IMDb metadata
  - Additional title information

#### Storage Manager
- **Greasemonkey Storage API** (`GM_setValue`/`GM_getValue`)
- **Persistent Context**: Series metadata across workflow steps
- **User Preferences**: UI settings and API keys
- **Cache Management**: Temporary data for preview/validation

### 3. Workflow Engine

#### State Machine
```
Step 1 (Create Show) 
  → Step 2 (Add Series)
  → Season Navigation
  → Step 3 (Bulk Add Episodes)
  → Step 4 (Upload Poster)
  → Step 5 (English Translation)
```

#### Page Detection
- URL-based routing with regex patterns
- Dynamic page type detection
- Context recovery on page load

### 4. Form Filler Engine

#### Smart Selectors
- Label-based field detection
- React component integration
- Dynamic input type handling
- Event emission (`input`, `change`)

#### Data Mapping
- TMDB genres → TVDB taxonomy
- TMDB status → TVDB status
- ISO-639-1 → ISO-639-2 language codes
- Date format conversion (YYYY-MM-DD → MM/DD/YYYY)

### 5. UI Components

#### Helper Panel
- Sticky positioning (top-right)
- Compact/collapsed states
- Hotkey trigger support
- Dynamic content based on step

#### Preview Box
- Real-time data preview
- Validation feedback
- Error messaging
- User confirmation prompts

## Data Flow

### 1. Initialization
```
Page Load → Page Detection → Context Load → Panel Render
```

### 2. Data Fetching
```
User Input (TMDB ID) → API Call → Data Processing → Context Update → Preview
```

### 3. Form Application
```
Context Data → Field Mapping → Value Setting → Event Emission → Validation
```

### 4. Workflow Progression
```
Apply & Continue → Form Validation → Context Save → Navigation → Context Load
```

## State Management

### Context Object Structure
```javascript
{
  tmdbId: string,
  imdbId: string,
  originalIso1: string,
  seriesSlug: string,
  seriesId: string,
  selectedSeason: number,
  posterPick: object,
  step: string,
  reviewCache: object
}
```

### Storage Keys
- `tvdbwf_tmdb_key`: TMDB API key
- `tvdbwf_omdb_key`: OMDb API key
- `tvdbwf_ctx`: Persistent context
- `tvdbwf_ui`: UI preferences

## Error Handling

### Network Errors
- Retry with exponential backoff
- User-friendly error messages
- Fallback to alternative data sources

### DOM Errors
- Unknown layout detection
- Diagnostic information capture
- Graceful degradation

### Validation Errors
- Real-time field validation
- Prevent invalid submissions
- User feedback loops

## Security Considerations

### API Key Management
- Keys stored in Greasemonkey storage
- Never exposed in DOM
- Optional encryption for sensitive keys

### Data Privacy
- Minimal data persistence
- No tracking or analytics
- User-controlled data retention

## Extension Points

### Plugin System (Future)
- Custom data source plugins
- Custom field mapping rules
- Custom validation logic

### Export/Import
- Context backup/restore
- Bulk operation templates
- CSV data exchange

## Performance Optimization

### Lazy Loading
- Load data only when needed
- Defer heavy operations
- Minimize DOM queries

### Caching Strategy
- API response caching
- DOM query result caching
- Context snapshot restoration

### Event Debouncing
- Rate limit API calls
- Debounce user input
- Batch DOM updates
