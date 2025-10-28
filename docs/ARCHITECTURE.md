# Architecture Documentation

This document describes the technical architecture and design decisions of the TVDB Workflow Automation script.

## Table of Contents

- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [API Integration](#api-integration)
- [User Interface](#user-interface)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)

## System Overview

The TVDB Workflow Automation script is a Tampermonkey userscript that automates the 5-step TVDB submission process. It operates as a client-side overlay that interacts with the TVDB website through DOM manipulation and API calls.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                      │
├─────────────────────────────────────────────────────────────┤
│  Tampermonkey Extension                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  TVDB Workflow Script                                   │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │ UI Layer    │ │ Logic Layer │ │ Data Layer  │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  TVDB Website (DOM Manipulation)                           │
├─────────────────────────────────────────────────────────────┤
│  External APIs (HTTP Requests)                             │
│  ┌─────────────┐ ┌─────────────┐                          │
│  │ TMDB API    │ │ OMDb API    │                          │
│  └─────────────┘ └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### UI Layer

The UI layer manages the user interface and user interactions.

#### Components:
- **Helper Panel**: Main overlay interface
- **Step Indicators**: Shows current workflow step
- **Form Controls**: Buttons and inputs for user interaction
- **Data Preview**: Displays fetched data before filling
- **Status Display**: Shows operation status and errors

#### Key Functions:
```javascript
// UI Management
function createHelperPanel()           // Creates main UI overlay
function generateUIHTML(step)          // Generates step-specific UI
function updateStatus(message)         // Updates status display
function updatePreview(content)        // Updates data preview

// Event Handling
function setupEventListeners()         // Sets up button click handlers
function handleButtonClick(buttonId)   // Handles button interactions
function toggleStealthMode()           // Toggles stealth mode
```

### Logic Layer

The logic layer contains the core business logic and workflow management.

#### Components:
- **Workflow Manager**: Manages the 5-step process
- **Form Filler**: Handles form field detection and filling
- **Data Processor**: Processes and validates fetched data
- **Error Handler**: Manages errors and recovery

#### Key Functions:
```javascript
// Workflow Management
function getCurrentStep()              // Detects current TVDB step
function applyStep(step)               // Applies step-specific logic
function applyAndContinue(step)        // Applies and navigates

// Form Processing
function fillField(field, value)       // Fills individual form fields
function findFormField(labelText)      // Finds form fields
function fillTranslationFields()       // Fills translation fields

// Data Processing
function processTmdbData(data)         // Processes TMDB API response
function processOmdbData(data)         // Processes OMDb API response
function mapLanguageCode(code)         // Maps language codes
```

### Data Layer

The data layer manages data storage, API communication, and data persistence.

#### Components:
- **API Client**: Handles external API calls
- **Data Storage**: Manages local data persistence
- **Configuration Manager**: Handles user settings
- **Cache Manager**: Manages data caching

#### Key Functions:
```javascript
// API Communication
async function fetchData(tmdbId)       // Fetches series data
async function fetchEpisodes()         // Fetches episode data
async function fetchPosters()          // Fetches poster data
async function fetchTranslation()      // Fetches translation data

// Data Management
function saveConfig()                  // Saves user configuration
function loadConfig()                  // Loads user configuration
function storeData(data)               // Stores fetched data
function retrieveData()                // Retrieves stored data
```

## Data Flow

### 1. Initialization Flow

```
User loads TVDB page
    ↓
Script detects page and step
    ↓
Helper panel appears
    ↓
User configures API keys (if needed)
    ↓
Ready for workflow
```

### 2. Data Fetching Flow

```
User enters TMDB ID
    ↓
Script validates input
    ↓
Calls TMDB API
    ↓
Processes response
    ↓
Calls OMDb API (if needed)
    ↓
Stores data globally
    ↓
Updates UI preview
    ↓
Ready for form filling
```

### 3. Form Filling Flow

```
User clicks "Fill" button
    ↓
Script detects form fields
    ↓
Validates data
    ↓
Fills fields sequentially
    ↓
Triggers form events
    ↓
Validates submission
    ↓
Proceeds to next step
```

### 4. Error Recovery Flow

```
Error occurs
    ↓
Log error details
    ↓
Attempt retry (if applicable)
    ↓
Show user notification
    ↓
Provide manual override option
    ↓
Continue or abort
```

## API Integration

### TMDB API Integration

#### Authentication
- API key stored securely in browser storage
- Key validation on script initialization
- Error handling for invalid keys

#### Rate Limiting
- Respects TMDB rate limits (40 requests per 10 seconds)
- Implements exponential backoff for retries
- Caches responses to minimize API calls

#### Data Processing
```javascript
// TMDB Response Processing
function processTmdbResponse(data) {
  return {
    name: data.name,
    originalName: data.original_name,
    overview: data.overview,
    originalLanguage: data.original_language,
    year: new Date(data.first_air_date).getFullYear(),
    genres: data.genres.map(g => ({ id: g.id, name: g.name })),
    homepage: data.homepage,
    imdbId: data.external_ids?.imdb_id
  };
}
```

### OMDb API Integration

#### Fallback Strategy
- Used when TMDB data is incomplete
- Provides additional metadata
- Handles different data formats

#### Data Mapping
```javascript
// OMDb Response Processing
function processOmdbResponse(data) {
  return {
    Title: data.Title,
    Plot: data.Plot !== 'N/A' ? data.Plot : '',
    Poster: data.Poster !== 'N/A' ? data.Poster : '',
    Language: data.Language,
    Year: data.Year
  };
}
```

## User Interface

### Helper Panel Design

#### Layout Structure
```
┌─────────────────────────────────┐
│ TVDB Workflow Helper v1.0    [X]│
├─────────────────────────────────┤
│ Step X: [Step Name]             │
├─────────────────────────────────┤
│ [Step-specific controls]        │
├─────────────────────────────────┤
│ [Data preview area]             │
├─────────────────────────────────┤
│ [Action buttons]                │
├─────────────────────────────────┤
│ Status: [Current status]        │
└─────────────────────────────────┘
```

#### Responsive Design
- Fixed positioning (top-right corner)
- Scrollable content area
- Collapsible sections
- Stealth mode support

### Form Field Detection

#### Multi-Strategy Approach
1. **Label Association**: `label[for="fieldId"]`
2. **Adjacent Elements**: `label + input`
3. **Placeholder Matching**: `input[placeholder*="text"]`
4. **Name Attribute**: `input[name="fieldName"]`
5. **ID Matching**: `input[id="fieldId"]`
6. **Data Attributes**: `input[data-field="name"]`
7. **TVDB-Specific Patterns**: Custom selectors for TVDB forms

#### Fallback Hierarchy
```javascript
function findFormField(labelText) {
  const strategies = [
    () => document.querySelector(`label[for*="${labelText}"] + input`),
    () => document.querySelector(`input[placeholder*="${labelText}"]`),
    () => document.querySelector(`input[name*="${labelText}"]`),
    () => document.querySelector(`input[id*="${labelText}"]`),
    // ... more strategies
  ];
  
  for (const strategy of strategies) {
    const field = strategy();
    if (field) return field;
  }
  return null;
}
```

## Error Handling

### Error Classification

#### API Errors
- **Network Errors**: Connection failures, timeouts
- **Authentication Errors**: Invalid API keys
- **Rate Limiting**: Too many requests
- **Data Errors**: Invalid responses, missing fields

#### Form Errors
- **Field Detection**: Fields not found
- **Validation Errors**: Invalid input data
- **Submission Errors**: Form submission failures

#### User Errors
- **Input Validation**: Invalid TMDB IDs, missing data
- **Configuration Errors**: Missing API keys, invalid settings

### Error Recovery Strategies

#### Automatic Recovery
- **Retry Logic**: Exponential backoff for transient errors
- **Fallback Data**: Use alternative data sources
- **Field Detection**: Try multiple field detection strategies

#### User-Assisted Recovery
- **Manual Override**: Allow user to manually fill fields
- **Configuration Fix**: Guide user to fix configuration issues
- **Error Reporting**: Provide detailed error information

### Error Logging

```javascript
function logError(error, context) {
  console.error(`[TVDB-Workflow] ${context}:`, error);
  
  // Log to status display
  updateStatus(`Error: ${error.message}`);
  
  // Store error for debugging
  window.tvdbErrors = window.tvdbErrors || [];
  window.tvdbErrors.push({
    timestamp: new Date().toISOString(),
    context: context,
    error: error.message,
    stack: error.stack
  });
}
```

## Security Considerations

### API Key Security
- **Storage**: Keys stored in browser storage (not localStorage)
- **Transmission**: Keys only sent to official API endpoints
- **Validation**: Keys validated before use
- **Cleanup**: Keys cleared on script uninstall

### Data Privacy
- **Local Processing**: All data processing happens client-side
- **No External Storage**: No data sent to third-party servers
- **User Control**: User can clear all stored data

### XSS Prevention
- **Input Sanitization**: All user inputs are sanitized
- **DOM Manipulation**: Safe DOM manipulation techniques
- **Event Handling**: Proper event handling to prevent injection

## Performance Optimization

### API Optimization
- **Caching**: Cache API responses to avoid redundant calls
- **Batch Requests**: Group related API calls
- **Lazy Loading**: Load data only when needed

### DOM Optimization
- **Efficient Selectors**: Use most efficient CSS selectors
- **Event Delegation**: Minimize event listener overhead
- **Memory Management**: Clean up unused DOM references

### JavaScript Optimization
- **Async/Await**: Use modern async patterns
- **Debouncing**: Debounce user input events
- **Throttling**: Throttle expensive operations

### Memory Management
```javascript
// Cleanup function
function cleanup() {
  // Remove event listeners
  document.removeEventListener('keydown', handleKeydown);
  
  // Clear stored data
  window.tvdbFetchedData = null;
  window.tvdbEpisodeData = null;
  
  // Clear intervals/timeouts
  clearTimeout(window.tvdbTimeout);
  clearInterval(window.tvdbInterval);
}
```

## Browser Compatibility

### Supported Browsers
- **Chrome**: 80+ (with Tampermonkey)
- **Firefox**: 75+ (with Tampermonkey)
- **Safari**: 13+ (with Tampermonkey)
- **Edge**: 80+ (with Tampermonkey)

### Feature Detection
```javascript
// Check for required features
function checkBrowserSupport() {
  const features = {
    fetch: typeof fetch !== 'undefined',
    asyncAwait: (async () => {}).constructor.name === 'AsyncFunction',
    localStorage: typeof localStorage !== 'undefined',
    querySelector: typeof document.querySelector !== 'undefined'
  };
  
  const unsupported = Object.entries(features)
    .filter(([name, supported]) => !supported)
    .map(([name]) => name);
    
  if (unsupported.length > 0) {
    throw new Error(`Unsupported features: ${unsupported.join(', ')}`);
  }
}
```

## Testing Strategy

### Unit Testing
- **Function Testing**: Test individual functions
- **Mock APIs**: Mock external API responses
- **Error Scenarios**: Test error handling paths

### Integration Testing
- **API Integration**: Test with real APIs
- **Form Interaction**: Test form filling on real TVDB pages
- **Workflow Testing**: Test complete workflow end-to-end

### User Testing
- **Usability Testing**: Test with real users
- **Browser Testing**: Test across different browsers
- **Performance Testing**: Test with large datasets

## Future Enhancements

### Planned Features
- **Multi-language Support**: Support for more languages
- **Batch Processing**: Process multiple series at once
- **Template System**: Save and reuse common configurations
- **Advanced Filtering**: Filter episodes by criteria

### Technical Improvements
- **TypeScript Migration**: Add type safety
- **Module System**: Break into smaller modules
- **Testing Framework**: Add comprehensive test suite
- **Performance Monitoring**: Add performance metrics

### API Enhancements
- **Additional Sources**: Support for more data sources
- **Real-time Updates**: Live data updates
- **Offline Support**: Work without internet connection