# Setup Guide

## Prerequisites

### Browser Extension
Install a userscript manager browser extension:
- **[Tampermonkey](https://www.tampermonkey.net/)** (Recommended - Chrome, Firefox, Edge, Safari, Opera)
- [Violentmonkey](https://violentmonkey.github.io/)
- [Greasemonkey](https://www.greasespot.net/) (Firefox only)

### API Keys
You'll need API keys from:

#### 1. TMDB (Required)
1. Visit [TMDB](https://www.themoviedb.org/)
2. Create a free account
3. Go to [API Settings](https://www.themoviedb.org/settings/api)
4. Request an API key
5. Copy the API key (you'll need this during setup)

#### 2. OMDb (Optional)
1. Visit [OMDb API](https://www.omdbapi.com/apikey.aspx)
2. Choose the free tier (1,000 requests/day)
3. Enter your email to receive the API key
4. Copy the API key (you'll need this during setup)

---

## Installation

### Step 1: Install Tampermonkey
1. Go to [tampermonkey.net](https://www.tampermonkey.net/)
2. Click "Install for Chrome" (or your browser)
3. Follow browser-specific prompts to add the extension
4. Verify installation by checking your browser's extensions

### Step 2: Install the Script

#### Option A: Manual Installation
1. Open the script file `src/tvdb-workflow-helper.user.js`
2. Copy the entire contents
3. Click on the Tampermonkey extension icon → "Dashboard"
4. Click the "+" button or "Create new script"
5. Paste the code
6. Click "File" → "Save" (or Ctrl+S)

#### Option B: Direct URL Installation (if available)
1. Click the Tampermonkey icon → "Install script from URL"
2. Enter the script URL
3. Click "Install"

### Step 3: Configure API Keys
1. Navigate to any TheTVDB page (or the script will activate automatically)
2. Look for the helper panel in the top-right corner
3. Enter your API keys:
   - **TMDB API Key**: Required - paste your TMDB key
   - **OMDb API Key**: Optional - paste your OMDb key (or leave empty)
4. Click "Save"
5. The keys will be stored securely and hidden from view

### Step 4: Verify Installation
1. Visit [TheTVDB Create Series page](https://thetvdb.com/series/create)
2. The helper panel should appear in the top-right
3. Click the panel to expand it
4. You should see the workflow helper interface

---

## Usage Quick Start

### Starting a New Submission
1. Navigate to `/series/create` on TheTVDB
2. Enter the TMDB ID of the series you want to submit
3. Click "Fetch Data"
4. Review the preview in the panel
5. Click "Apply" to autofill the form
6. Click "Apply & Continue ▶" to proceed to Step 2

### Workflow Steps
The script will guide you through all 5 steps:
- **Step 1**: Create Show → Autofill IDs and official site
- **Step 2**: Add Series → Autofill name, overview, country, status, genres
- **Step 3**: Bulk Add Episodes → Autofill episode data
- **Step 4**: Upload Poster → Select and upload poster
- **Step 5**: English Translation → Add English translation (if needed)

---

## Configuration Options

### Panel Settings
Access via the helper panel's settings icon:

- **Show Panel**: Toggle panel visibility
- **Auto-Advance**: Automatically navigate to next step after applying
- **Compact Keys**: Hide API key fields (use "Manage Keys" to show again)
- **Hotkey**: Toggle panel with Ctrl+Alt+T (Win/Linux) or Control+Option+T (Mac)

### Managing API Keys
1. Click "Manage Keys" in the panel
2. Update your API keys if needed
3. Click "Save" to store changes
4. Keys are hidden again after saving

---

## Troubleshooting

### Script Not Loading
- Check Tampermonkey is enabled in your browser
- Verify the script is enabled in Tampermonkey dashboard
- Check browser console for errors (F12)

### Panel Not Appearing
- Press Ctrl+Alt+T (Windows/Linux) or Control+Option+T (Mac) to toggle
- Check TheTVDB URL matches expected patterns
- Refresh the page and try again

### API Errors
- Verify your API keys are correct
- Check your API key limits haven't been exceeded
- Ensure you have an internet connection
- Try the "Retry" button if available

### Fields Not Filling
- Check the preview shows correct data
- Manually verify the TMDB ID is correct
- Some fields may require manual adjustment
- Check browser console for errors

### Data Not Saving Across Steps
- Ensure you click "Apply & Continue ▶" to save context
- Check browser storage isn't being cleared
- Try manually saving with the "Save" button

### Unknown Layout Error
- TheTVDB may have updated their layout
- Click the diagnostic link to copy DOM info
- Report the issue with diagnostic information

---

## Browser Compatibility

### Fully Supported
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Opera (latest)
- ✅ Safari (latest)

### Partially Supported
- ⚠️ Older browsers may have limited functionality

### Not Supported
- ❌ Internet Explorer
- ❌ Legacy browsers without modern JavaScript support

---

## Getting Help

### Documentation
- [Requirements Document](../REQUIREMENTS.md)
- [Architecture Guide](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)

### Support
- Open an issue on the repository
- Include browser version and error messages
- Provide diagnostic information when available

---

## Advanced Usage

### Keyboard Shortcuts
- `Ctrl+Alt+T` / `Control+Option+T`: Toggle panel
- `Esc`: Close panel (if open)

### Context Management
The script maintains context across all steps:
- TMDB ID persists through all steps
- IMDb ID is reused where possible
- Series slug and ID are captured automatically
- Selected season is remembered

### Batch Operations
For multiple series:
1. Complete one series fully
2. Clear context (optional)
3. Start next series
4. Repeat

---

## Security & Privacy

### API Keys
- Stored securely in browser storage
- Never exposed in the DOM
- Only sent to official API endpoints
- Not shared with any third parties

### Data Privacy
- No data is sent to third-party servers
- All API calls are direct to TMDB/OMDb
- No tracking or analytics
- User controls all data retention

---

## Updating the Script

### Automatic Updates
If the script is hosted on a URL:
1. Tampermonkey will check for updates periodically
2. Click "Update" when prompted
3. Review changes before installing

### Manual Updates
1. Open the new script file
2. Copy the contents
3. Open Tampermonkey Dashboard
4. Find the script and click "Edit"
5. Replace with new code
6. Save

---

## Uninstallation

To remove the script:
1. Click Tampermonkey icon → Dashboard
2. Find "TVDB Workflow Helper"
3. Click the trash icon or right-click → Delete
4. Confirm deletion

To keep data but disable:
1. Click Tampermonkey icon → Dashboard
2. Find "TVDB Workflow Helper"
3. Toggle the script off (switch to the left)

Your API keys and settings will be preserved if you reinstall later.
