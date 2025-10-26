# TVDB Submission Workflow Automation

> A single, reliable Tampermonkey userscript that automates TheTVDB's 5-step submission workflow end-to-end using TMDB (+ OMDb fallback), with a compact helper panel, validation, and controlled navigation.

## Overview

This project provides a Tampermonkey userscript to automate the complete TVDB series submission process, reducing manual data entry from hours to minutes by leveraging TMDB and OMDb APIs.

## Features

- **5-Step Automated Workflow**: From series creation to English translation
- **Smart Data Fetching**: TMDB primary with OMDb fallback
- **Compact UI Panel**: Sticky helper panel with hotkey support (Ctrl+Alt+T / Control+Option+T)
- **Intelligent Fallbacks**: Handles missing data gracefully
- **Validation & Preview**: See data before applying
- **Multi-season Support**: Ready for bulk episode submission
- **Persistent Context**: Maintains state across steps

## Project Structure

```
tvdb-automation/
├── README.md                 # This file
├── REQUIREMENTS.md           # Detailed requirements document
├── CHANGELOG.md             # Version history and updates
├── LICENSE                  # Project license
├── docs/                    # Additional documentation
│   ├── ARCHITECTURE.md      # System architecture
│   ├── SETUP.md             # Installation guide
│   └── API_REFERENCE.md     # API usage documentation
└── src/                     # Source code (to be added)
    ├── tvdb-workflow-helper.user.js
    └── helpers/
```

## Quick Start

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser
2. Get API keys:
   - [TMDB API Key](https://www.themoviedb.org/settings/api)
   - [OMDb API Key](https://www.omdbapi.com/apikey.aspx) (optional)
3. Copy the userscript from `src/tvdb-workflow-helper.user.js` into Tampermonkey
4. Configure your API keys in the userscript panel
5. Navigate to TVDB and start using the automation

## Workflow Steps

### Step 1: Create Show
- Autofill IMDb ID, TMDB ID, Official Site
- Preview: Multiple title sources with years and languages

### Step 2: Add Series
- Force original language from TMDB
- Autofill name, overview, country, status, genres
- Intelligent language mapping

### Step 3: Bulk Add Episodes
- Auto-populate episode numbers, names, overviews
- Smart date formatting
- Runtime fallback chain (episode → season → series)

### Step 4: Upload Poster
- Automatically use best TMDB poster
- Language selection
- Manual confirmation before submission

### Step 5: English Translation (Conditional)
- Only if original language ≠ English
- Automatic translation from TMDB

## Requirements

See [REQUIREMENTS.md](REQUIREMENTS.md) for the complete specification document.

## Development Status

🚧 **Planning Phase** - Documentation complete, implementation pending

## Contributing

Contributions welcome! Please see the requirements document for architecture details.

## License

[To be specified]

## Support

For issues, questions, or contributions, please open an issue on the repository. 