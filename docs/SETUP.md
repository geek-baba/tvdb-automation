# Setup Instructions

This guide will walk you through setting up the TVDB Workflow Automation script from start to finish.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [API Key Setup](#api-key-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

#### 1. Web Browser
The script works with the following browsers:
- **Chrome** 80+ (Recommended)
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

#### 2. Tampermonkey Extension
Download and install Tampermonkey for your browser:

- **Chrome**: [Tampermonkey Chrome Extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Tampermonkey Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Safari**: [Tampermonkey Safari Extension](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Required Accounts

#### 1. TMDB Account
- **Website**: [The Movie Database](https://www.themoviedb.org/)
- **Purpose**: Get API key for fetching series and episode data
- **Cost**: Free
- **Sign up**: Create account at https://www.themoviedb.org/account/signup

#### 2. OMDb Account
- **Website**: [OMDb API](http://www.omdbapi.com/)
- **Purpose**: Get API key for fallback data and additional metadata
- **Cost**: Free (with usage limits)
- **Sign up**: Get API key at http://www.omdbapi.com/apikey.aspx

#### 3. TheTVDB Account (Optional)
- **Website**: [TheTVDB](https://thetvdb.com/)
- **Purpose**: Submit data to TVDB
- **Cost**: Free
- **Sign up**: Create account at https://thetvdb.com/register

## Installation

### Step 1: Install Tampermonkey

1. **Open your browser**
2. **Navigate to the Tampermonkey store page** (links above)
3. **Click "Add to Chrome/Firefox/Safari"**
4. **Confirm installation**
5. **Verify installation**: Look for the Tampermonkey icon in your browser toolbar

### Step 2: Install the Script

#### Method 1: Direct Installation (Recommended)

1. **Open Tampermonkey Dashboard**
   - Click the Tampermonkey icon in your browser toolbar
   - Select "Dashboard"

2. **Create New Script**
   - Click the "+" button or "Create a new script"
   - This opens the script editor

3. **Replace Default Content**
   - Select all existing content (Ctrl+A)
   - Delete it
   - Copy the entire content from `src/tvdb-workflow-complete.user.js`
   - Paste it into the editor

4. **Save the Script**
   - Press Ctrl+S or click the save icon
   - The script will be automatically enabled

#### Method 2: File Installation

1. **Download the Script**
   - Download `src/tvdb-workflow-complete.user.js` to your computer

2. **Open Tampermonkey Dashboard**
   - Click the Tampermonkey icon
   - Select "Dashboard"

3. **Import Script**
   - Click the "+" button
   - Select "Install from file"
   - Choose the downloaded script file
   - Click "Install"

### Step 3: Verify Installation

1. **Check Script Status**
   - Open Tampermonkey Dashboard
   - Verify "TVDB Workflow Complete" is listed and enabled
   - Status should show "Enabled"

2. **Test Script Loading**
   - Navigate to https://thetvdb.com/series/create
   - Look for the "TVDB Workflow Helper" panel in the top-right corner
   - If you see the panel, installation was successful

## API Key Setup

### Step 1: Get TMDB API Key

1. **Create TMDB Account**
   - Go to https://www.themoviedb.org/account/signup
   - Fill in your details and create account
   - Verify your email address

2. **Request API Key**
   - Go to https://www.themoviedb.org/settings/api
   - Click "Request an API Key"
   - Select "Developer" as the type
   - Fill in the application details:
     - **Application Name**: TVDB Workflow Automation
     - **Application Summary**: Tampermonkey script for TVDB automation
     - **Application URL**: https://github.com/shwet/tvdb-automation
   - Accept the terms and submit

3. **Copy API Key**
   - Once approved, copy your API key (32 characters)
   - Keep it secure and don't share it

### Step 2: Get OMDb API Key

1. **Request API Key**
   - Go to http://www.omdbapi.com/apikey.aspx
   - Enter your email address
   - Click "Request API Key"

2. **Check Email**
   - Check your email for the API key
   - Copy the API key (8 characters)
   - Keep it secure

### Step 3: Configure API Keys in Script

1. **Navigate to TVDB**
   - Go to any TVDB page (e.g., https://thetvdb.com/series/create)
   - The helper panel should appear

2. **Open Configuration**
   - Click "Manage Keys" button in the helper panel
   - This opens the API key configuration

3. **Enter API Keys**
   - **TMDB API Key**: Paste your 32-character TMDB key
   - **OMDb API Key**: Paste your 8-character OMDb key
   - Click "Save Configuration"

4. **Verify Configuration**
   - The status should show "✓ TMDB Key Saved | ✓ OMDb Key Saved"
   - Keys are stored securely in your browser

## Configuration

### Basic Configuration

The script works with default settings, but you can customize:

#### Stealth Mode
- **Purpose**: Hide the helper panel to avoid detection
- **Toggle**: Press `Ctrl+Alt+S` or click "Stealth" button
- **Show Panel**: Press `Ctrl+Alt+T` when in stealth mode

#### Debug Logging
- **Default**: Enabled
- **Purpose**: Show detailed logs in browser console
- **Access**: Press F12 to open console
- **Disable**: Comment out logging functions (not recommended)

### Advanced Configuration

#### Language Mapping
The script automatically maps TMDB language codes to TVDB format. You can modify the mapping in the script:

```javascript
const LANGUAGE_MAP = {
    'en': 'eng',
    'te': 'tel',
    'hi': 'hin',
    // Add more mappings as needed
};
```

#### Field Detection
The script uses multiple strategies to find form fields. You can add custom selectors:

```javascript
function findFormField(labelText) {
    const strategies = [
        // Add your custom selectors here
        () => document.querySelector(`input[data-custom="${labelText}"]`),
        // ... existing strategies
    ];
}
```

## Testing

### Step 1: Test Basic Functionality

1. **Navigate to TVDB**
   - Go to https://thetvdb.com/series/create
   - Verify the helper panel appears

2. **Test API Keys**
   - Click "Manage Keys" to verify keys are saved
   - Status should show both keys as saved

3. **Test Data Fetching**
   - Enter a TMDB ID (e.g., 277489)
   - Click "Fetch Data"
   - Verify data appears in the preview

### Step 2: Test Complete Workflow

1. **Step 1 - Create Show**
   - Enter TMDB ID: 277489
   - Click "Fetch Data"
   - Click "Fill"
   - Click "Apply & Continue"

2. **Step 2 - Add Series**
   - Click "Fetch Data"
   - Click "Fill"
   - Click "Apply & Continue"

3. **Step 3 - Bulk Add Episodes**
   - Click "Fetch Episodes"
   - Click "Fill"
   - Click "Apply & Continue"

4. **Step 4 - Upload Poster**
   - Click "Fetch Posters"
   - Select a poster
   - Click "Upload Selected"
   - Click "Apply & Continue"

5. **Step 5 - English Translation**
   - Click "Fetch Translation"
   - Click "Fill Translation"
   - Click "Apply & Continue"

### Step 3: Test Error Handling

1. **Test Invalid TMDB ID**
   - Enter invalid ID (e.g., 999999999)
   - Verify error message appears

2. **Test Missing API Keys**
   - Clear API keys in configuration
   - Try to fetch data
   - Verify error message appears

3. **Test Network Errors**
   - Disconnect internet
   - Try to fetch data
   - Verify error handling works

## Troubleshooting

### Common Issues

#### Script Not Loading

**Symptoms:**
- No helper panel appears on TVDB pages
- Tampermonkey shows script as disabled

**Solutions:**
1. **Check Tampermonkey Status**
   - Open Tampermonkey Dashboard
   - Verify script is enabled
   - Check for any error messages

2. **Check URL Matching**
   - Script only runs on thetvdb.com domains
   - Ensure you're on a valid TVDB page

3. **Refresh Page**
   - Try refreshing the page
   - Clear browser cache if needed

#### API Keys Not Working

**Symptoms:**
- "API key not configured" error
- Data fetching fails

**Solutions:**
1. **Verify API Keys**
   - Check keys are correctly copied
   - Ensure no extra spaces or characters
   - Verify keys are saved in configuration

2. **Test API Keys Manually**
   - Test TMDB: https://api.themoviedb.org/3/tv/277489?api_key=YOUR_KEY
   - Test OMDb: http://www.omdbapi.com/?i=tt32047599&apikey=YOUR_KEY

3. **Check API Limits**
   - TMDB: 40 requests per 10 seconds
   - OMDb: 1000 requests per day (free tier)

#### Fields Not Filling

**Symptoms:**
- Data is fetched but forms aren't filled
- "Field not found" errors in console

**Solutions:**
1. **Check Console Logs**
   - Press F12 to open console
   - Look for error messages
   - Check field detection logs

2. **Try Manual Fill**
   - Use manual field detection if available
   - Check if TVDB page structure has changed

3. **Update Script**
   - Check for script updates
   - Report issues with specific TVDB pages

#### Language Issues

**Symptoms:**
- Wrong language selected
- Language field not filled

**Solutions:**
1. **Check Language Mapping**
   - Verify language codes are correct
   - Add custom mappings if needed

2. **Manual Language Selection**
   - Select language manually if automatic fails
   - Check TVDB language options

### Debug Information

#### Console Logs
The script provides detailed logging. To view logs:

1. **Open Browser Console**
   - Press F12
   - Go to "Console" tab

2. **Look for TVDB Logs**
   - Logs are prefixed with `[TVDB-Workflow]`
   - Look for error messages and field detection logs

3. **Common Log Messages**
   - `✅` - Success messages
   - `❌` - Error messages
   - `🔍` - Debug information

#### Field Detection Debug
To debug field detection issues:

1. **Enable Field Logging**
   - The script automatically logs all form fields
   - Look for "All form fields on page" messages

2. **Check Field Selectors**
   - Verify field selectors are working
   - Add custom selectors if needed

### Getting Help

#### Before Asking for Help

1. **Check This Guide**
   - Review troubleshooting steps
   - Check common issues

2. **Gather Information**
   - Browser and version
   - Script version
   - Console error messages
   - Steps to reproduce

3. **Test Basic Functionality**
   - Verify API keys work
   - Test on different TVDB pages

#### Reporting Issues

When reporting issues, include:

1. **System Information**
   - Browser and version
   - Operating system
   - Tampermonkey version

2. **Script Information**
   - Script version
   - Configuration settings
   - Console error messages

3. **Reproduction Steps**
   - Exact steps to reproduce
   - Expected vs actual behavior
   - Screenshots if helpful

#### Community Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check this guide and API reference
- **Code Review**: Submit pull requests for improvements

## Maintenance

### Regular Updates

1. **Check for Updates**
   - Monitor GitHub repository for updates
   - Update script when new versions are available

2. **Backup Configuration**
   - Export your configuration before updates
   - Save API keys securely

3. **Test After Updates**
   - Test basic functionality after updates
   - Report any issues immediately

### Performance Optimization

1. **Clear Cache**
   - Clear browser cache regularly
   - Clear Tampermonkey cache if needed

2. **Monitor API Usage**
   - Check API usage limits
   - Optimize API calls if needed

3. **Update Dependencies**
   - Keep browser and Tampermonkey updated
   - Update script dependencies

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or create an issue on GitHub.