# TVDB Workflow Automation

A comprehensive Tampermonkey userscript that automates TheTVDB's 5-step submission workflow using TMDB and OMDb APIs.

## 🎯 Overview

This script streamlines the process of submitting TV series data to TheTVDB by automating all 5 steps of the submission workflow:

1. **Create Show** - Fetch and fill basic series information
2. **Add Series** - Fill detailed series metadata
3. **Bulk Add Episodes** - Create and fill episode information
4. **Upload Poster** - Select and upload series poster
5. **English Translation** - Add English translations

## ✨ Features

### 🔄 Complete Workflow Automation
- **5-Step Process**: Automates the entire TVDB submission workflow
- **Smart Navigation**: Automatically detects current step and shows relevant controls
- **Form Filling**: Human-like form filling with anti-bot detection
- **Error Recovery**: Comprehensive error handling and retry mechanisms

### 🌐 Multi-API Integration
- **TMDB Primary**: Uses The Movie Database as the primary data source
- **OMDb Fallback**: Falls back to OMDb when TMDB data is incomplete
- **Language Mapping**: Converts TMDB language codes to TVDB format
- **Data Validation**: Ensures data quality and completeness

### 🎨 User Experience
- **Helper Panel**: Compact, scrollable overlay with step-specific controls
- **Real-time Preview**: Shows fetched data before filling forms
- **Stealth Mode**: Optional stealth mode to avoid detection
- **Manual Override**: Ability to manually adjust any field before submission

### 🛠️ Technical Features
- **Robust Field Detection**: Multiple fallback strategies for form field detection
- **Sequential Processing**: Handles episode creation with proper timing
- **Poster Management**: Fetches, previews, and selects best quality posters
- **Translation Support**: Fetches and applies English translations
- **Debug Logging**: Comprehensive logging for troubleshooting

## 📋 Prerequisites

### Required
- **Tampermonkey Browser Extension** ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) | [Safari](https://apps.apple.com/us/app/tampermonkey/id1482490089))
- **TMDB API Key** ([Get one here](https://www.themoviedb.org/settings/api))
- **OMDb API Key** ([Get one here](http://www.omdbapi.com/apikey.aspx))

### Optional
- **TheTVDB Account** (for submitting data)

## 🚀 Installation

1. **Install Tampermonkey** in your browser
2. **Download the script**: `src/tvdb-workflow-complete.user.js`
3. **Open Tampermonkey Dashboard**
4. **Click "Create a new script"**
5. **Replace the default content** with the script content
6. **Save the script** (Ctrl+S)

## ⚙️ Configuration

### First-Time Setup
1. **Navigate to any TVDB page** (e.g., https://thetvdb.com/series/create)
2. **The helper panel will appear** in the top-right corner
3. **Click "Manage Keys"** to configure API keys
4. **Enter your TMDB and OMDb API keys**
5. **Click "Save Configuration"**

### API Keys
- **TMDB API Key**: Required for fetching series and episode data
- **OMDb API Key**: Required for IMDb data fallback and additional metadata

## 📖 Usage Guide

### Step 1: Create Show
1. **Enter TMDB TV ID** (e.g., 277489)
2. **Click "Fetch Data"** to get series information
3. **Review the preview** of fetched data
4. **Click "Fill"** to populate the form
5. **Click "Apply & Continue"** to proceed

### Step 2: Add Series
1. **Click "Fetch Data"** to get detailed series metadata
2. **Review the preview** showing series details
3. **Click "Fill"** to populate all fields
4. **Click "Apply & Continue"** to proceed

### Step 3: Bulk Add Episodes
1. **Enter Season Number** (default: 1)
2. **IMDb ID** will be auto-filled from TMDB
3. **Click "Fetch Episodes"** to get episode data
4. **Click "Fill"** to create and fill episode forms
5. **Click "Apply & Continue"** to proceed

### Step 4: Upload Poster
1. **Select Poster Source** (TMDB recommended)
2. **Click "Fetch Posters"** to get available posters
3. **Select preferred poster** from the preview
4. **Click "Upload Selected"** to fill URL and language
5. **Click "Apply & Continue"** to proceed

### Step 5: English Translation
1. **Select Translation Source** (TMDB recommended)
2. **Click "Fetch Translation"** to get English data
3. **Click "Fill Translation"** to populate translation fields
4. **Click "Apply & Continue"** to complete

## 🔧 Advanced Features

### Stealth Mode
- **Toggle**: Press `Ctrl+Alt+S` or click "Stealth" button
- **Purpose**: Hides the helper panel to avoid detection
- **Show Panel**: Press `Ctrl+Alt+T` when in stealth mode

### Manual Override
- **Field Editing**: You can manually edit any field before filling
- **Data Review**: Always review fetched data before submission
- **Skip Steps**: Use "Skip Step" button if manual intervention is needed

### Debug Mode
- **Console Logging**: Open browser console (F12) to see detailed logs
- **Field Detection**: Logs show which fields are found and filled
- **Error Reporting**: Comprehensive error messages for troubleshooting

## 🐛 Troubleshooting

### Common Issues

#### Script Not Loading
- **Check Tampermonkey**: Ensure the extension is enabled
- **Check URL Match**: Script only runs on thetvdb.com domains
- **Refresh Page**: Try refreshing the page

#### Fields Not Filling
- **Check API Keys**: Ensure both TMDB and OMDb keys are configured
- **Check Console**: Look for error messages in browser console
- **Manual Fill**: Use manual field detection if automatic fails

#### Language Issues
- **Language Mapping**: Script maps TMDB codes to TVDB format
- **Fallback**: Falls back to English if language not found
- **Manual Override**: You can manually select the correct language

### Debug Information
- **Console Logs**: Press F12 and check Console tab
- **Field Detection**: Logs show all detected form fields
- **API Responses**: Logs show API call results
- **Error Details**: Detailed error messages for debugging

## 📁 File Structure

```
tvdb-automation/
├── src/
│   ├── tvdb-workflow-complete.user.js  # Main userscript
│   └── tvdb-workflow-helper.user.js    # Template/example
├── docs/
│   ├── API_REFERENCE.md               # API documentation
│   ├── ARCHITECTURE.md                # Technical architecture
│   └── SETUP.md                       # Setup instructions
├── REQUIREMENTS.md                    # Project requirements
├── CHANGELOG.md                       # Version history
└── README.md                          # This file
```

## 🔄 Version History

### v1.2.0 (Production Ready - Current)
- ✅ **Production Optimized**: Cleaned up debug code, optimized performance
- ✅ **Enhanced Error Handling**: Global error handler with critical error reporting
- ✅ **UI Consistency**: All "Apply & Continue" buttons renamed to "Apply" for consistency
- ✅ **Step-Specific Button Logic**: Proper button detection for each step (Save, Add Episodes, etc.)
- ✅ **Language Detection Fix**: Resolved Hindi/Chinese language mapping conflicts
- ✅ **Loop Prevention**: Fixed infinite loop issues with processing flags
- ✅ **Complete 5-Step Workflow**: Fully functional end-to-end automation

### v1.1.0 (Previous)
- ✅ Complete 5-step workflow automation
- ✅ TMDB and OMDb API integration
- ✅ Multi-language support (130+ languages)
- ✅ Poster management system
- ✅ Translation support
- ✅ Manual overrides and error recovery

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TheTVDB** for providing the submission platform
- **TMDB** for comprehensive TV and movie data
- **OMDb** for additional metadata and fallback support
- **Tampermonkey** for the userscript platform

## 📞 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Review the console logs** for error details
3. **Create an issue** on GitHub with detailed information
4. **Include browser console logs** when reporting bugs

---

**Happy TVDB Submitting!** 🎬📺