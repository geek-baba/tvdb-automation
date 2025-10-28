// ==UserScript==
// @name         TVDB Workflow Helper - Complete
// @namespace    tvdb.workflow
// @version      1.0.0
// @description  Complete TVDB 5-step workflow helper with TMDB/OMDb integration
// @author       you
// @match        https://thetvdb.com/series/create*
// @match        https://thetvdb.com/series/create-step2*
// @match        https://thetvdb.com/series/*/seasons/official/*/bulkadd*
// @match        https://thetvdb.com/artwork/upload*
// @match        https://thetvdb.com/series/*/translate/eng*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.themoviedb.org
// @connect      www.omdbapi.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('TVDB Workflow Helper - Complete v1.0 loaded');

    // Configuration and state
    const CONFIG = {
        tmdbApiKey: '',
        omdbApiKey: '',
        debugMode: true,
        showApiKeys: false,
        autoAdvance: false,
        stealthMode: false
    };

    // Context persistence
    let context = {
        tmdbId: '',
        imdbId: '',
        originalIso1: '',
        seriesSlug: '',
        seriesId: '',
        selectedSeason: '',
        posterPick: '',
        step: '',
        reviewCache: {}
    };

    // Language mapping ISO-639-1 to TVDB ISO-639-2
    const LANGUAGE_MAP = {
        'en': 'eng',
        'es': 'spa',
        'fr': 'fre',
        'de': 'ger',
        'it': 'ita',
        'pt': 'por',
        'ru': 'rus',
        'ja': 'jpn',
        'ko': 'kor',
        'zh': 'chi',
        'ar': 'ara',
        'hi': 'hin',
        'th': 'tha',
        'vi': 'vie',
        'tr': 'tur',
        'pl': 'pol',
        'nl': 'dut',
        'sv': 'swe',
        'da': 'dan',
        'no': 'nor',
        'fi': 'fin',
        'cs': 'cze',
        'hu': 'hun',
        'ro': 'rum',
        'bg': 'bul',
        'hr': 'hrv',
        'sk': 'slo',
        'sl': 'slv',
        'et': 'est',
        'lv': 'lav',
        'lt': 'lit',
        'uk': 'ukr',
        'be': 'bel',
        'mk': 'mac',
        'sq': 'alb',
        'mt': 'mlt',
        'is': 'ice',
        'ga': 'gle',
        'cy': 'wel',
        'eu': 'baq',
        'ca': 'cat',
        'gl': 'glg',
        'te': 'tel'
    };

    // Helper function to map TMDB language code to TVDB language code
    function mapLanguageCode(tmdbCode) {
        if (!tmdbCode) return 'en';
        
        // Direct mapping
        if (LANGUAGE_MAP[tmdbCode]) {
            return LANGUAGE_MAP[tmdbCode];
        }
        
        // Try to find partial match
        for (const [tmdb, tvdb] of Object.entries(LANGUAGE_MAP)) {
            if (tmdbCode.toLowerCase().includes(tmdb.toLowerCase()) || 
                tmdb.toLowerCase().includes(tmdbCode.toLowerCase())) {
                return tvdb;
            }
        }
        
        // Return original if no mapping found
        return tmdbCode;
    }

    // Language code to full name mapping
    const LANGUAGE_NAMES = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'tr': 'Turkish',
        'pl': 'Polish',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'da': 'Danish',
        'no': 'Norwegian',
        'fi': 'Finnish',
        'cs': 'Czech',
        'hu': 'Hungarian',
        'ro': 'Romanian',
        'bg': 'Bulgarian',
        'hr': 'Croatian',
        'sk': 'Slovak',
        'sl': 'Slovenian',
        'et': 'Estonian',
        'lv': 'Latvian',
        'lt': 'Lithuanian',
        'uk': 'Ukrainian',
        'be': 'Belarusian',
        'mk': 'Macedonian',
        'sq': 'Albanian',
        'mt': 'Maltese',
        'is': 'Icelandic',
        'ga': 'Irish',
        'cy': 'Welsh',
        'eu': 'Basque',
        'ca': 'Catalan',
        'gl': 'Galician',
        'te': 'Telugu'
    };

    // TMDB to TVDB status mapping
    const STATUS_MAP = {
        'Returning Series': 'Continuing',
        'Ended': 'Ended',
        'Cancelled': 'Ended',
        'Planned': 'Upcoming',
        'In Production': 'Upcoming',
        'Upcoming': 'Upcoming'
    };

    // TMDB to TVDB genre mapping
    const GENRE_MAP = {
        'Action & Adventure': 'Action',
        'Animation': 'Animation',
        'Comedy': 'Comedy',
        'Crime': 'Crime',
        'Documentary': 'Documentary',
        'Drama': 'Drama',
        'Family': 'Family',
        'Kids': 'Children',
        'Mystery': 'Mystery',
        'News': 'News',
        'Reality': 'Reality',
        'Sci-Fi & Fantasy': 'Science Fiction',
        'Soap': 'Soap',
        'Talk': 'Talk Show',
        'Thriller': 'Thriller',
        'War & Politics': 'War',
        'Western': 'Western'
    };

    // TMDB to TVDB country mapping (using TVDB country codes)
    const COUNTRY_MAP = {
        'US': 'usa',
        'IN': 'ind',
        'GB': 'gbr',
        'CA': 'can',
        'AU': 'aus',
        'DE': 'deu',
        'FR': 'fra',
        'JP': 'jpn',
        'KR': 'kor',
        'CN': 'chn',
        'BR': 'bra',
        'MX': 'mex',
        'ES': 'esp',
        'IT': 'ita',
        'RU': 'rus',
        'NL': 'nld',
        'SE': 'swe',
        'NO': 'nor',
        'DK': 'dnk',
        'FI': 'fin'
    };

    // Current step detection
    function getCurrentStep() {
        const path = window.location.pathname;
        const url = window.location.href;
        
        if (path === '/series/create') return 'step1';
        if (path.includes('/series/create-step2') || url.includes('create-step2')) return 'step2';
        if (path.includes('/bulkadd')) return 'step3';
        if (path.includes('/artwork/upload')) return 'step4';
        if (path.includes('/translate/eng')) return 'step5';
        return 'unknown';
    }

    // Load configuration and context
    function loadConfig() {
        try {
            CONFIG.tmdbApiKey = GM_getValue('tvdbwf_tmdb_key', '');
            CONFIG.omdbApiKey = GM_getValue('tvdbwf_omdb_key', '');
            CONFIG.showApiKeys = GM_getValue('tvdbwf_ui_showKeys', false);
            CONFIG.autoAdvance = GM_getValue('tvdbwf_ui_autoAdvance', false);

            const savedContext = GM_getValue('tvdbwf_ctx', '{}');
            context = { ...context, ...JSON.parse(savedContext) };
        } catch (e) {
            console.log('Using default configuration');
        }
    }

    // Save configuration and context
    function saveConfig() {
        try {
            GM_setValue('tvdbwf_tmdb_key', CONFIG.tmdbApiKey);
            GM_setValue('tvdbwf_omdb_key', CONFIG.omdbApiKey);
            GM_setValue('tvdbwf_ui_showKeys', CONFIG.showApiKeys);
            GM_setValue('tvdbwf_ui_autoAdvance', CONFIG.autoAdvance);
            GM_setValue('tvdbwf_ctx', JSON.stringify(context));
        } catch (e) {
            console.error('Failed to save configuration:', e);
        }
    }

    // Logging function
    function log(message, data = null) {
        if (CONFIG.debugMode) {
            console.log(`[TVDB] ${message}`, data || '');
        }
    }

    // Wait for page to load
    function waitForPage() {
        if (document.readyState === 'complete') {
            init();
        } else {
            setTimeout(waitForPage, 100);
        }
    }

    // Initialize the script
    function init() {
        log('Initializing TVDB Workflow Helper - Complete');
        loadConfig();
        
        // Only create UI if not in stealth mode
        if (!CONFIG.stealthMode) {
            createUI();
        } else {
            log('Stealth mode enabled - UI hidden');
        }
        
        setupHotkey();
    }

    // Setup hotkey
    function setupHotkey() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 't') {
                e.preventDefault();
                if (CONFIG.stealthMode) {
                    // In stealth mode, toggle stealth mode off and show UI
                    CONFIG.stealthMode = false;
                    saveConfig();
                    createUI();
                    updateStatus('Stealth mode disabled - UI shown');
                } else {
                    togglePanel();
                }
            }
            
            // Stealth mode hotkey: Ctrl+Alt+S
            if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 's') {
                e.preventDefault();
                toggleStealthMode();
            }
        });
    }
    
    // Toggle stealth mode
    function toggleStealthMode() {
        CONFIG.stealthMode = !CONFIG.stealthMode;
        saveConfig();
        
        if (CONFIG.stealthMode) {
            // Hide UI
            const panel = document.getElementById('tvdb-helper-ui');
            if (panel) {
                panel.remove();
            }
            console.log('Stealth mode enabled - UI hidden. Press Ctrl+Alt+T to show UI.');
        } else {
            // Show UI
            createUI();
            console.log('Stealth mode disabled - UI shown');
        }
    }

    // Toggle panel visibility
    function togglePanel() {
        const panel = document.getElementById('tvdb-helper-ui');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Create the user interface
    function createUI() {
        // Remove existing UI if any
        const existingUI = document.getElementById('tvdb-helper-ui');
        if (existingUI) {
            existingUI.remove();
        }

        const currentStep = getCurrentStep();

        // Create main container
        const container = document.createElement('div');
        container.id = 'tvdb-helper-ui';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 380px;
            max-height: 80vh;
            background: #1a1a1a;
            color: #ffffff;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            z-index: 99999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            scrollbar-width: thin;
            scrollbar-color: #4CAF50 #333;
        `;
        
        // Add webkit scrollbar styles
        const style = document.createElement('style');
        style.textContent = `
            #tvdb-helper-ui::-webkit-scrollbar {
                width: 8px;
            }
            #tvdb-helper-ui::-webkit-scrollbar-track {
                background: #333;
                border-radius: 4px;
            }
            #tvdb-helper-ui::-webkit-scrollbar-thumb {
                background: #4CAF50;
                border-radius: 4px;
            }
            #tvdb-helper-ui::-webkit-scrollbar-thumb:hover {
                background: #45a049;
            }
        `;
        document.head.appendChild(style);

        container.innerHTML = generateUIHTML(currentStep);
        document.body.appendChild(container);

        // Add event listeners
        setupEventListeners();

        log('UI created successfully for step:', currentStep);
    }

    // Generate UI HTML based on current step
    function generateUIHTML(step) {
        const apiKeysSection = CONFIG.showApiKeys ? `
            <div style="margin-bottom: 15px; padding: 10px; background: #333; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #4CAF50;">API Configuration</h4>
                    <button id="tvdb-hide-keys" style="background: #666; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 12px;">Hide</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 12px;">TMDB API Key:</label>
                    <input type="password" id="tvdb-tmdb-key" placeholder="Enter TMDB API key"
                           style="width: 100%; padding: 6px; border: 1px solid #555; border-radius: 4px; background: #222; color: white; font-size: 12px;"
                           value="${CONFIG.tmdbApiKey}">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 12px;">OMDb API Key:</label>
                    <input type="password" id="tvdb-omdb-key" placeholder="Enter OMDb API key"
                           style="width: 100%; padding: 6px; border: 1px solid #555; border-radius: 4px; background: #222; color: white; font-size: 12px;"
                           value="${CONFIG.omdbApiKey}">
                </div>
                <button id="tvdb-save-config" style="width: 100%; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 8px; cursor: pointer; font-size: 12px;">Save API Keys</button>
            </div>
        ` : `
            <div style="margin-bottom: 15px; padding: 10px; background: #333; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0; color: #4CAF50;">API Configuration</h4>
                    <button id="tvdb-show-keys" style="background: #666; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 12px;">Manage Keys</button>
                </div>
                <div style="color: #ccc; font-size: 12px; margin-top: 5px;">
                    ${CONFIG.tmdbApiKey ? '✓ TMDB Key Saved' : '✗ TMDB Key Missing'} |
                    ${CONFIG.omdbApiKey ? '✓ OMDb Key Saved' : '✗ OMDb Key Missing'}
                </div>
            </div>
        `;

        const stepContent = generateStepContent(step);

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #4CAF50;">TVDB Workflow Helper v1.0</h3>
                <div>
                    <button id="tvdb-stealth-btn" style="background: #9c27b0; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer; margin-right: 5px; font-size: 12px;">Stealth</button>
                    <button id="tvdb-minimize-btn" style="background: #666; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer; margin-right: 5px; font-size: 12px;">−</button>
                    <button id="tvdb-close-btn" style="background: #f44336; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer; font-size: 12px;">×</button>
                </div>
            </div>

            <div style="margin-bottom: 15px; padding: 8px; background: #333; border-radius: 4px; text-align: center;">
                <strong style="color: #FF9800;">Step ${step.replace('step', '')}: ${getStepName(step)}</strong>
            </div>

            ${apiKeysSection}

            ${stepContent}

            <div id="tvdb-preview" style="background: #333; padding: 10px; border-radius: 4px; font-size: 12px; color: #ccc; min-height: 60px; max-height: 200px; overflow-y: auto; margin-bottom: 10px;">
                ${getPreviewContent(step)}
            </div>

            <div id="tvdb-status" style="background: #333; padding: 10px; border-radius: 4px; font-size: 12px; color: #ccc; min-height: 30px; max-height: 100px; overflow-y: auto;">
                Ready...
            </div>
        `;
    }

    // Generate step-specific content
    function generateStepContent(step) {
        switch (step) {
            case 'step1':
                return `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId}">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Manual IMDb ID (fallback):</label>
                        <input type="text" id="tvdb-manual-imdb" placeholder="e.g., tt1234567"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.imdbId}">
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-fetch-data" class="tvdb-workflow-btn" style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fetch Data</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="flex: 1; background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fill</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-apply-continue-step1" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply & Continue ▶</button>
                        <button id="tvdb-skip-step" class="tvdb-workflow-btn" style="flex: 1; background: #666; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Skip Step</button>
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-clear-form" class="tvdb-workflow-btn" style="flex: 1; background: #ff6b6b; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Clear Form</button>
                        <button id="tvdb-retry-fill" class="tvdb-workflow-btn" style="flex: 1; background: #ffa500; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Retry Fill</button>
                    </div>
                `;

            case 'step2':
                return `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id-step2" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId}">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Series Data:</label>
                        <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 12px; color: #ccc;">
                            ${context.tmdbId ? `TMDB ID: ${context.tmdbId}` : 'No TMDB ID available'}
                            ${context.imdbId ? `<br>IMDb ID: ${context.imdbId}` : ''}
                            ${context.originalIso1 ? `<br>Original Language: ${context.originalIso1}` : ''}
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-fetch-data-step2" class="tvdb-workflow-btn" style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fetch Data</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="flex: 1; background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fill</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-apply-continue-step2" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply & Continue ▶</button>
                        <button id="tvdb-skip-step" style="flex: 1; background: #666; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Skip Step</button>
                    </div>
                `;

            case 'step3':
                // Auto-fetch IMDb ID when Step 3 loads
                if (context.tmdbId && !context.imdbId) {
                    fetchImdbIdFromTmdb(context.tmdbId).then(imdbId => {
                        if (imdbId) {
                            context.imdbId = imdbId;
                            // Update the input field if it exists
                            const imdbInput = document.getElementById('tvdb-imdb-id-step3');
                            if (imdbInput) {
                                imdbInput.value = imdbId;
                            }
                            log(`Auto-fetched IMDb ID: ${imdbId}`);
                        }
                    }).catch(error => {
                        log('Could not auto-fetch IMDb ID:', error);
                    });
                }
                return `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id-step3" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId}">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Season Number:</label>
                        <input type="number" id="tvdb-season-num" placeholder="1" min="1" max="50"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.selectedSeason}">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Episode Data:</label>
                        <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 12px; color: #ccc;">
                            ${context.tmdbId ? `TMDB ID: ${context.tmdbId}` : 'No TMDB ID available'}
                            ${context.imdbId ? `<br>IMDb ID: ${context.imdbId}` : ''}
                            ${context.selectedSeason ? `<br>Season: ${context.selectedSeason}` : ''}
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">IMDb ID (auto-filled from TMDB):</label>
                        <input type="text" id="tvdb-imdb-id-step3" placeholder="Will be auto-filled from TMDB" value="${context.imdbId || ''}" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: #fff; font-size: 12px;" readonly>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-fetch-episodes" class="tvdb-workflow-btn" style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fetch Episodes</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="flex: 1; background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fill</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-apply-continue-step3" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply & Continue ▶</button>
                        <button id="tvdb-skip-step" class="tvdb-workflow-btn" style="flex: 1; background: #666; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Skip Step</button>
                    </div>
                `;

            case 'step4':
                return `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id-step4" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId || ''}">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Poster Source:</label>
                        <select id="tvdb-poster-source" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: #fff; font-size: 12px;">
                            <option value="tmdb">TMDB (Recommended)</option>
                            <option value="omdb">OMDb</option>
                            <option value="manual">Manual Upload</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Poster Data:</label>
                        <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 12px; color: #ccc;">
                            ${context.tmdbId ? `TMDB ID: ${context.tmdbId}` : 'No TMDB ID available'}
                            ${context.imdbId ? `<br>IMDb ID: ${context.imdbId}` : ''}
                            ${context.posterPick ? `<br>Selected: ${context.posterPick}` : '<br>No poster selected'}
                        </div>
                    </div>

                    <div id="tvdb-poster-preview" style="margin-bottom: 15px; text-align: center;">
                        <div style="color: #ccc; font-size: 12px;">Poster preview will appear here</div>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-fetch-posters" class="tvdb-workflow-btn" style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fetch Posters</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="flex: 1; background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Upload Selected</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-apply-continue-step4" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply & Continue ▶</button>
                        <button id="tvdb-skip-step" class="tvdb-workflow-btn" style="flex: 1; background: #666; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Skip Step</button>
                    </div>
                `;

            case 'step5':
                return `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id-step5" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId || ''}">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Translation Data:</label>
                        <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 12px; color: #ccc;">
                            ${context.tmdbId ? `TMDB ID: ${context.tmdbId}` : 'No TMDB ID available'}
                            ${context.imdbId ? `<br>IMDb ID: ${context.imdbId}` : ''}
                            ${context.originalIso1 !== 'en' ? `<br>Translating from ${context.originalIso1} to English` : '<br>No translation needed (already English)'}
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Translation Source:</label>
                        <select id="tvdb-translation-source" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: #fff; font-size: 12px;">
                            <option value="tmdb">TMDB (Recommended)</option>
                            <option value="omdb">OMDb</option>
                            <option value="manual">Manual Entry</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Fields to Translate:</label>
                        <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 12px; color: #ccc;">
                            <div style="margin-bottom: 5px;">✓ Series Name (English)</div>
                            <div style="margin-bottom: 5px;">✓ Series Overview (English)</div>
                            <div style="margin-bottom: 5px;">✓ Episode Names (English)</div>
                            <div style="margin-bottom: 5px;">✓ Episode Overviews (English)</div>
                        </div>
                    </div>

                    <div id="tvdb-translation-preview" style="margin-bottom: 15px;">
                        <div style="color: #ccc; font-size: 12px; margin-bottom: 8px;">Translation preview:</div>
                        <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 11px; color: #ccc;">
                            <div><strong>Series Name:</strong> <span id="preview-series-name">Loading...</span></div>
                            <div><strong>Overview:</strong> <span id="preview-overview">Loading...</span></div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-fetch-translation" class="tvdb-workflow-btn" style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fetch Translation</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="flex: 1; background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fill Translation</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-apply-continue-step5" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply & Continue ▶</button>
                        <button id="tvdb-skip-step" class="tvdb-workflow-btn" style="flex: 1; background: #666; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Skip Step</button>
                    </div>
                `;

            default:
                return `
                    <div style="text-align: center; color: #ccc; padding: 20px;">
                        Unknown step. Please navigate to a valid TVDB workflow page.
                    </div>
                `;
        }
    }

    // Get step name
    function getStepName(step) {
        const names = {
            'step1': 'Create Show',
            'step2': 'Add Series',
            'step3': 'Bulk Add Episodes',
            'step4': 'Upload Poster',
            'step5': 'English Translation'
        };
        return names[step] || 'Unknown';
    }

    // Get preview content
    function getPreviewContent(step) {
        switch (step) {
            case 'step1':
                return 'Enter TMDB TV ID and click "Fetch Data" to see show information...';
            case 'step2':
                return 'Series metadata will be displayed here after data fetch...';
            case 'step3':
                return 'Episode data will be displayed here after fetch...';
            case 'step4':
                return 'Poster options will be displayed here after fetch...';
            case 'step5':
                return 'Translation data will be displayed here after fetch...';
            default:
                return 'Ready...';
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Close and minimize buttons
        document.getElementById('tvdb-close-btn').onclick = () => {
            document.getElementById('tvdb-helper-ui').remove();
        };

        document.getElementById('tvdb-minimize-btn').onclick = () => {
            const panel = document.getElementById('tvdb-helper-ui');
            panel.style.display = 'none';
        };
        
        document.getElementById('tvdb-stealth-btn').onclick = () => {
            toggleStealthMode();
        };

        // API key management
        const showKeysBtn = document.getElementById('tvdb-show-keys');
        const hideKeysBtn = document.getElementById('tvdb-hide-keys');
        const saveConfigBtn = document.getElementById('tvdb-save-config');

        if (showKeysBtn) showKeysBtn.onclick = () => {
            CONFIG.showApiKeys = true;
            saveConfig();
            createUI();
        };

        if (hideKeysBtn) hideKeysBtn.onclick = () => {
            CONFIG.showApiKeys = false;
            saveConfig();
            createUI();
        };

        if (saveConfigBtn) saveConfigBtn.onclick = saveConfiguration;

        // Step-specific buttons
        const currentStep = getCurrentStep();
        setupStepEventListeners(currentStep);
    }

    // Setup step-specific event listeners
    function setupStepEventListeners(step) {
        // Common buttons
        const applyBtn = document.getElementById('tvdb-apply');
        const skipBtn = document.getElementById('tvdb-skip-step');

        if (applyBtn) applyBtn.onclick = () => applyStep(step);
        if (skipBtn) skipBtn.onclick = () => skipStep(step);

        // Step-specific Apply & Continue buttons
        const applyContinueBtn = document.getElementById(`tvdb-apply-continue-${step}`);
        if (applyContinueBtn) applyContinueBtn.onclick = () => applyAndContinue(step);

        // Step-specific buttons
        switch (step) {
            case 'step1':
                const fetchDataBtn = document.getElementById('tvdb-fetch-data');
                if (fetchDataBtn) fetchDataBtn.onclick = fetchData;
                
                const clearFormBtn = document.getElementById('tvdb-clear-form');
                if (clearFormBtn) clearFormBtn.onclick = clearForm;
                
                const retryFillBtn = document.getElementById('tvdb-retry-fill');
                if (retryFillBtn) retryFillBtn.onclick = retryFill;
                break;
            case 'step2':
                const fetchDataStep2Btn = document.getElementById('tvdb-fetch-data-step2');
                if (fetchDataStep2Btn) fetchDataStep2Btn.onclick = fetchDataStep2;
                break;
            case 'step3':
                const fetchEpisodesBtn = document.getElementById('tvdb-fetch-episodes');
                if (fetchEpisodesBtn) fetchEpisodesBtn.onclick = fetchEpisodes;
                break;
            case 'step4':
                const fetchPostersBtn = document.getElementById('tvdb-fetch-posters');
                if (fetchPostersBtn) fetchPostersBtn.onclick = fetchPosters;
                break;
            case 'step5':
                const fetchTranslationBtn = document.getElementById('tvdb-fetch-translation');
                if (fetchTranslationBtn) fetchTranslationBtn.onclick = fetchTranslation;
                break;
        }
    }

    // Save configuration
    function saveConfiguration() {
        CONFIG.tmdbApiKey = document.getElementById('tvdb-tmdb-key').value;
        CONFIG.omdbApiKey = document.getElementById('tvdb-omdb-key').value;

        saveConfig();
        updateStatus('Configuration saved successfully!');
        log('Configuration saved');
    }

    // Update status display
    function updateStatus(message) {
        const statusDiv = document.getElementById('tvdb-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.scrollTop = statusDiv.scrollHeight;
        }
    }

    // Update preview display
    function updatePreview(content) {
        const previewDiv = document.getElementById('tvdb-preview');
        if (previewDiv) {
            previewDiv.innerHTML = content;
        }
    }

    // Fetch data for step 2
    async function fetchDataStep2() {
        const tmdbId = document.getElementById('tvdb-tmdb-id-step2').value.trim();

        if (!tmdbId) {
            updateStatus('Please enter a TMDB TV ID');
            return;
        }

        if (!CONFIG.tmdbApiKey) {
            updateStatus('Please configure TMDB API key first');
            return;
        }

        updateStatus('Fetching data from TMDB...');
        log('Starting data fetch for TMDB ID:', tmdbId);

        try {
            // Fetch TMDB data
            const tmdbData = await fetchTmdbData(tmdbId);

            let omdbData = null;
            let imdbId = tmdbData.imdbId;

            // Always try OMDb to get IMDb title and language, even if we have IMDb ID from TMDB
            if (CONFIG.omdbApiKey && imdbId) {
                updateStatus('Fetching OMDb data for IMDb title and language...');
                omdbData = await fetchOmdbDataByImdbId(imdbId);
                log('OMDb data fetched by IMDb ID:', omdbData);
            } else if (!imdbId && CONFIG.omdbApiKey && tmdbData.name && tmdbData.year) {
                updateStatus('No IMDb ID in TMDB, trying OMDb...');
                omdbData = await fetchOmdbData(tmdbData.name, tmdbData.year);
                if (omdbData && omdbData.imdbId) {
                    imdbId = omdbData.imdbId;
                }
                log('OMDb data fetched by title:', omdbData);
            }

            // Update context
            context.tmdbId = tmdbId;
            context.imdbId = imdbId;
            context.originalIso1 = tmdbData.originalLanguage;

            // Store fetched data globally
            window.tvdbFetchedData = {
                tmdb: tmdbData,
                omdb: omdbData,
                imdbId: imdbId
            };

            // Generate preview
            const preview = generateStep2Preview(tmdbData, omdbData);
            updatePreview(preview);

            updateStatus('Data fetched successfully! Click Fill to populate the form.');
            log('Data fetch completed successfully');

        } catch (error) {
            updateStatus(`Error fetching data: ${error.message}`);
            log('Error fetching data:', error);
        }
    }

    // Auto-fetch IMDb ID from TMDB
    async function fetchImdbIdFromTmdb(tmdbId) {
        try {
            const seriesUrl = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${CONFIG.tmdbApiKey}`;
            const response = await fetch(seriesUrl);
            if (response.ok) {
                const data = await response.json();
                const imdbId = data.external_ids?.imdb_id;
                if (imdbId) {
                    log(`Auto-fetched IMDb ID from TMDB: ${imdbId}`);
                    return imdbId;
                } else {
                    log('No IMDb ID found in TMDB external_ids');
                    return null;
                }
            } else {
                log(`Failed to fetch series info: ${response.status}`);
                return null;
            }
        } catch (error) {
            log('Error fetching IMDb ID from TMDB:', error);
            return null;
        }
    }

    // Fetch episodes for step 3
    async function fetchEpisodes() {
        const seasonNum = document.getElementById('tvdb-season-num').value.trim();
        const tmdbId = document.getElementById('tvdb-tmdb-id-step3').value.trim();
        const imdbId = document.getElementById('tvdb-imdb-id-step3').value.trim();

        if (!seasonNum) {
            updateStatus('Please enter a season number');
            return;
        }

        if (!tmdbId) {
            updateStatus('Please enter a TMDB TV ID');
            return;
        }

        if (!CONFIG.tmdbApiKey) {
            updateStatus('Please configure TMDB API key first');
            return;
        }

        updateStatus(`Fetching episodes for Season ${seasonNum}...`);
        log(`Starting episode fetch for TMDB ID: ${tmdbId}, Season: ${seasonNum}, IMDb ID: ${imdbId || 'Not provided'}`);

        try {
            // Fetch episodes from TMDB with IMDb ID for OMDb fallback
            const episodes = await fetchTmdbEpisodes(tmdbId, seasonNum, imdbId);

            // Store episode data globally
            window.tvdbEpisodeData = {
                season: parseInt(seasonNum),
                episodes: episodes,
                tmdbId: tmdbId,
                imdbId: imdbId
            };

            // Generate preview
            const preview = generateStep3Preview(episodes);
            updatePreview(preview);

            updateStatus(`Fetched ${episodes.length} episodes for Season ${seasonNum}! Click Fill to populate the form.`);
            log(`Episode fetch completed successfully. Found ${episodes.length} episodes`);

        } catch (error) {
            updateStatus(`Error fetching episodes: ${error.message}`);
            log('Error fetching episodes:', error);
        }
    }

    // Fetch episodes from TMDB
    async function fetchTmdbEpisodes(tmdbId, seasonNum, providedImdbId = null) {
        // Try multiple languages to get descriptions
        const languages = ['en-US', 'te', 'hi', 'ta', 'ml', 'kn'];
        let bestData = null;
        let bestLanguage = 'en-US';
        
        for (const lang of languages) {
            try {
                const url = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNum}?api_key=${CONFIG.tmdbApiKey}&language=${lang}`;
                log(`Trying TMDB with language: ${lang}`);
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    const episodesWithDescriptions = data.episodes.filter(ep => ep.overview && ep.overview.trim());
                    log(`Language ${lang}: ${episodesWithDescriptions.length}/${data.episodes.length} episodes have descriptions`);
                    
                    if (!bestData || episodesWithDescriptions.length > bestData.episodes.filter(ep => ep.overview && ep.overview.trim()).length) {
                        bestData = data;
                        bestLanguage = lang;
                    }
                }
            } catch (error) {
                log(`Error fetching TMDB data for language ${lang}:`, error);
            }
        }
        
        if (!bestData) {
            throw new Error(`TMDB API error: Could not fetch data for any language`);
        }
        
        log(`Using TMDB data from language: ${bestLanguage}`);
        const data = bestData;

        // Get IMDb ID for OMDb fallback - use provided ID or fetch from TMDB
        let seriesImdbId = providedImdbId;
        
        if (!seriesImdbId) {
            try {
                const seriesUrl = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${CONFIG.tmdbApiKey}`;
                const seriesResponse = await fetch(seriesUrl);
                if (seriesResponse.ok) {
                    const seriesData = await seriesResponse.json();
                    seriesImdbId = seriesData.external_ids?.imdb_id;
                    log(`Series IMDb ID from TMDB: ${seriesImdbId}`);
                } else {
                    log(`Failed to fetch series info: ${seriesResponse.status}`);
                }
            } catch (error) {
                log('Could not fetch series info for IMDb ID:', error);
            }
        } else {
            log(`Using provided IMDb ID: ${seriesImdbId}`);
        }

        // Process episodes and fetch OMDb data for missing descriptions
        const episodes = [];
        
        // Count episodes with missing descriptions
        const episodesWithoutDescriptions = data.episodes.filter(ep => !ep.overview || ep.overview.trim() === '');
        log(`Episodes without descriptions: ${episodesWithoutDescriptions.length}/${data.episodes.length}`);
        
        // Fetch OMDb season data if we have missing descriptions
        let omdbSeasonData = null;
        if (episodesWithoutDescriptions.length > 0 && seriesImdbId && CONFIG.omdbApiKey) {
            log(`🔄 Fetching OMDb data for ${episodesWithoutDescriptions.length} episodes missing descriptions...`);
            log(`Series IMDb ID: ${seriesImdbId}, Season: ${seasonNum}`);
            log(`OMDb API Key configured: ${!!CONFIG.omdbApiKey}`);
            
            try {
                omdbSeasonData = await fetchOmdbSeason(seriesImdbId, seasonNum);
                if (omdbSeasonData && omdbSeasonData.length > 0) {
                    log(`✅ Got OMDb season data with ${omdbSeasonData.length} episodes`);
                } else {
                    log(`❌ No OMDb season data returned`);
                }
            } catch (error) {
                log('❌ Could not fetch OMDb season data:', error);
            }
        } else {
            if (episodesWithoutDescriptions.length === 0) {
                log('✅ All episodes have descriptions from TMDB, skipping OMDb');
            } else if (!seriesImdbId) {
                log('❌ No series IMDb ID available, skipping OMDb');
            } else if (!CONFIG.omdbApiKey) {
                log('❌ No OMDb API key configured, skipping OMDb');
            }
        }
        
        // Process each episode
        for (const episode of data.episodes) {
            let overview = episode.overview;
            let descriptionSource = 'TMDB';
            
            // If no overview from TMDB and we have OMDb data, try to find it
            if ((!overview || overview.trim() === '') && omdbSeasonData) {
                const omdbEpisode = omdbSeasonData.find(ep => parseInt(ep.Episode) === episode.episode_number);
                if (omdbEpisode && omdbEpisode.Plot && omdbEpisode.Plot !== 'N/A' && omdbEpisode.Plot.trim() !== '') {
                    overview = omdbEpisode.Plot;
                    descriptionSource = 'OMDb';
                    log(`✅ Got OMDb description for S${seasonNum}E${episode.episode_number}: ${overview.substring(0, 50)}...`);
                } else {
                    log(`❌ No OMDb description found for S${seasonNum}E${episode.episode_number}`);
                }
            }

            episodes.push({
                episodeNumber: episode.episode_number,
                name: episode.name,
                overview: overview,
                airDate: episode.air_date,
                runtime: episode.runtime || 0,
                stillPath: episode.still_path,
                descriptionSource: descriptionSource
            });
        }
        
        // Log final results
        const episodesWithDescriptions = episodes.filter(ep => ep.overview && ep.overview.trim() !== '');
        const tmdbDescriptions = episodes.filter(ep => ep.descriptionSource === 'TMDB' && ep.overview && ep.overview.trim() !== '').length;
        const omdbDescriptions = episodes.filter(ep => ep.descriptionSource === 'OMDb' && ep.overview && ep.overview.trim() !== '').length;
        
        log(`📊 Final results: ${episodesWithDescriptions.length}/${episodes.length} episodes have descriptions`);
        log(`📊 TMDB descriptions: ${tmdbDescriptions}, OMDb descriptions: ${omdbDescriptions}`);

        return episodes;
    }

    // Fetch season data from OMDb (for description fallback)
    async function fetchOmdbSeason(seriesImdbId, seasonNum) {
        try {
            log(`🔍 Fetching OMDb season data for ${seriesImdbId}, season ${seasonNum}`);
            
            // First, test if the series exists in OMDb
            const seriesTestUrl = `https://www.omdbapi.com/?i=${seriesImdbId}&apikey=${CONFIG.omdbApiKey}`;
            log(`🔍 Testing series existence: ${seriesTestUrl}`);
            
            const seriesTestResponse = await fetch(seriesTestUrl);
            const seriesTestData = await seriesTestResponse.json();
            log('📊 OMDb series test response:', seriesTestData);
            
            if (seriesTestData.Response === 'False') {
                log(`❌ Series not found in OMDb: ${seriesTestData.Error}`);
                return null;
            }
            
            log(`✅ Series found in OMDb: ${seriesTestData.Title} (${seriesTestData.Year})`);
            log(`📊 Series type: ${seriesTestData.Type}, Total seasons: ${seriesTestData.totalSeasons || 'Unknown'}`);
            
            // Now fetch the season data
            const seasonUrl = `https://www.omdbapi.com/?i=${seriesImdbId}&Season=${seasonNum}&apikey=${CONFIG.omdbApiKey}`;
            log(`🔍 Fetching season data: ${seasonUrl}`);
            
            const response = await fetch(seasonUrl);
            
            if (!response.ok) {
                throw new Error(`OMDb API error: ${response.status}`);
            }
            
            const data = await response.json();
            log('📊 OMDb season response:', data);
            
            if (data.Response === 'False') {
                log(`❌ Season not found in OMDb: ${data.Error}`);
                return null;
            }
            
            // OMDb returns episodes in an array
            if (data.Episodes && Array.isArray(data.Episodes)) {
                log(`✅ Found ${data.Episodes.length} episodes in OMDb season data`);
                // Log first episode details for debugging
                if (data.Episodes.length > 0) {
                    log(`📊 First episode sample:`, data.Episodes[0]);
                    // Check if episodes have Plot data
                    const episodesWithPlot = data.Episodes.filter(ep => ep.Plot && ep.Plot !== 'N/A' && ep.Plot.trim() !== '');
                    log(`📊 Episodes with plot descriptions: ${episodesWithPlot.length}/${data.Episodes.length}`);
                }
                return data.Episodes;
            } else {
                log('❌ No Episodes array found in OMDb response');
                log('📊 Available keys in response:', Object.keys(data));
                return null;
            }
            
        } catch (error) {
            log('❌ Error fetching OMDb season data:', error);
            return null;
        }
    }

    // Generate step 3 preview
    function generateStep3Preview(episodes) {
        if (!episodes || episodes.length === 0) {
            return '<div style="color: #ff6b6b;">No episodes found for this season</div>';
        }

        let html = `<div style="background: #222; padding: 10px; border-radius: 4px; font-size: 12px; color: #ccc; margin-bottom: 10px;">
            <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">📺 Episodes Preview (${episodes.length} episodes)</div>`;

        episodes.slice(0, 5).forEach((episode, index) => {
            html += `<div style="margin-bottom: 8px; padding: 5px; background: #333; border-radius: 3px;">
                <div><strong>Episode ${episode.episodeNumber}:</strong> ${episode.name || 'No title'}</div>
                <div><strong>Air Date:</strong> ${episode.airDate || 'TBA'}</div>
                <div><strong>Runtime:</strong> ${episode.runtime || 0} minutes</div>
                <div><strong>Overview:</strong> ${episode.overview ? episode.overview.substring(0, 100) + '...' : 'No overview'}</div>
            </div>`;
        });

        if (episodes.length > 5) {
            html += `<div style="color: #FF9800;">... and ${episodes.length - 5} more episodes</div>`;
        }

        html += '</div>';
        return html;
    }

    // Fetch data for step 1
    async function fetchData() {
        const tmdbId = document.getElementById('tvdb-tmdb-id').value.trim();
        const manualImdb = document.getElementById('tvdb-manual-imdb').value.trim();

        if (!tmdbId) {
            updateStatus('Please enter a TMDB TV ID');
            return;
        }

        if (!CONFIG.tmdbApiKey) {
            updateStatus('Please configure TMDB API key first');
            return;
        }

        updateStatus('Fetching data from TMDB...');
        log('Starting data fetch for TMDB ID:', tmdbId);

        try {
            // Fetch TMDB data
            const tmdbData = await fetchTmdbData(tmdbId);

            let omdbData = null;
            let imdbId = tmdbData.imdbId || manualImdb;

            // Always try OMDb to get IMDb title and language, even if we have IMDb ID from TMDB
            if (CONFIG.omdbApiKey && imdbId) {
                updateStatus('Fetching OMDb data for IMDb title and language...');
                omdbData = await fetchOmdbDataByImdbId(imdbId);
                log('OMDb data fetched by IMDb ID:', omdbData);
            } else if (!imdbId && CONFIG.omdbApiKey && tmdbData.name && tmdbData.year) {
                updateStatus('No IMDb ID in TMDB, trying OMDb...');
                omdbData = await fetchOmdbData(tmdbData.name, tmdbData.year);
                if (omdbData && omdbData.imdbId) {
                    imdbId = omdbData.imdbId;
                }
                log('OMDb data fetched by title:', omdbData);
            }

            // Update context
            context.tmdbId = tmdbId;
            context.imdbId = imdbId;
            context.originalIso1 = tmdbData.originalLanguage;
            context.step = 'step1';

            // Store fetched data
            window.tvdbFetchedData = {
                tmdb: tmdbData,
                omdb: omdbData,
                imdbId: imdbId,
                tmdbId: tmdbId,
                officialSite: tmdbData.homepage
            };

            // Update preview
            updatePreview(generateStep1Preview(tmdbData, omdbData, imdbId));

            // Update status
            if (imdbId) {
                updateStatus(`Data fetched successfully! IMDb ID: ${imdbId}`);
            } else {
                updateStatus('Data fetched, but no IMDb ID found');
            }

            saveConfig();
            log('Data fetch completed', window.tvdbFetchedData);

        } catch (error) {
            updateStatus(`Error fetching data: ${error.message}`);
            log('Error fetching data:', error);
        }
    }

    // Generate step 2 preview
    function generateStep2Preview(tmdbData, omdbData) {
        return `
            <div style="background: #222; padding: 10px; border-radius: 4px; font-size: 12px; color: #ccc; margin-bottom: 10px;">
                <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">📺 Series Data Preview</div>
                <div><strong>TMDB Title:</strong> ${tmdbData.name || 'N/A'}</div>
                <div><strong>TMDB Original Title:</strong> ${tmdbData.originalName || 'N/A'}</div>
                <div><strong>TMDB Year:</strong> ${tmdbData.year || 'N/A'}</div>
                <div><strong>TMDB Language:</strong> ${tmdbData.originalLanguage || 'N/A'}</div>
                <div><strong>TMDB Overview:</strong> ${tmdbData.overview ? tmdbData.overview.substring(0, 100) + '...' : 'N/A'}</div>
                <div><strong>TMDB Genres:</strong> ${tmdbData.genres ? tmdbData.genres.map(g => g.name || g).join(', ') : 'N/A'}</div>
                <div><strong>TMDB Status:</strong> ${tmdbData.status || 'N/A'}</div>
                <div><strong>TMDB Country:</strong> ${tmdbData.originCountry ? tmdbData.originCountry.join(', ') : 'N/A'}</div>
                ${omdbData ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                        <div style="color: #FF9800; font-weight: bold;">IMDb Data (from OMDb)</div>
                        <div><strong>IMDb Title:</strong> ${omdbData.title || 'N/A'}</div>
                        <div><strong>IMDb Year:</strong> ${omdbData.year || 'N/A'}</div>
                        <div><strong>IMDb Language:</strong> ${omdbData.language || 'N/A'}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Generate step 1 preview
    function generateStep1Preview(tmdbData, omdbData, imdbId) {
        let html = '<h4 style="margin: 0 0 10px 0; color: #4CAF50;">Fetched Data Preview:</h4>';

        if (tmdbData) {
            const originalLangName = LANGUAGE_NAMES[tmdbData.originalLanguage] || tmdbData.originalLanguage;
            html += `<div><strong>TMDB Original:</strong> ${tmdbData.originalName} (${tmdbData.year})</div>`;
            html += `<div><strong>TMDB English:</strong> ${tmdbData.name} (${tmdbData.year})</div>`;
            html += `<div><strong>Original Language:</strong> ${originalLangName} (${tmdbData.originalLanguage})</div>`;
            html += `<div><strong>IMDb ID:</strong> ${imdbId || 'Not found'}</div>`;
            html += `<div><strong>Official Site:</strong> ${tmdbData.homepage || 'Not found'}</div>`;
        }

        if (omdbData) {
            html += `<div><strong>IMDb Title:</strong> ${omdbData.title} (${omdbData.year})</div>`;
            html += `<div><strong>IMDb Language:</strong> ${omdbData.language}</div>`;
        } else {
            html += `<div><strong>IMDb Data:</strong> Not available from OMDb</div>`;
        }

        return html;
    }

    // Fetch TMDB data
    async function fetchTmdbData(tmdbId) {
        const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${CONFIG.tmdbApiKey}&append_to_response=external_ids,images,translations`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
            name: data.name,
            originalName: data.original_name,
            year: data.first_air_date ? new Date(data.first_air_date).getFullYear() : null,
            originalLanguage: data.original_language,
            imdbId: data.external_ids?.imdb_id || null,
            homepage: data.homepage || null,
            overview: data.overview,
            translations: data.translations?.translations || [],
            images: data.images?.posters || [],
            originCountry: data.origin_country || [],
            status: data.status,
            genres: data.genres || [],
            episodeRunTime: data.episode_run_time || []
        };
    }

    // Fetch OMDb data by title and year
    async function fetchOmdbData(title, year) {
        const searchTitle = encodeURIComponent(title);
        const url = `https://www.omdbapi.com/?apikey=${CONFIG.omdbApiKey}&t=${searchTitle}&y=${year}&type=series`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.Response === 'False') {
            return null;
        }

        return {
            title: data.Title,
            year: data.Year,
            language: data.Language,
            imdbId: data.imdbID || null
        };
    }

    // Fetch OMDb data by IMDb ID
    async function fetchOmdbDataByImdbId(imdbId) {
        const url = `https://www.omdbapi.com/?apikey=${CONFIG.omdbApiKey}&i=${imdbId}&type=series`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.Response === 'False') {
            return null;
        }

        return {
            title: data.Title,
            year: data.Year,
            language: data.Language,
            imdbId: data.imdbID || null
        };
    }

    // Apply step (fill form)
    function applyStep(step) {
        log(`Applying step: ${step}`);
        updateStatus(`Applying ${getStepName(step)}...`);

        try {
            switch (step) {
                case 'step1':
                    applyStep1();
                    break;
                case 'step2':
                    applyStep2();
                    break;
                case 'step3':
                    applyStep3();
                    break;
                case 'step4':
                    applyStep4();
                    break;
                case 'step5':
                    applyStep5();
                    break;
            }

            updateStatus(`${getStepName(step)} applied successfully!`);
            log(`Step ${step} applied successfully`);

        } catch (error) {
            updateStatus(`Error applying ${getStepName(step)}: ${error.message}`);
            log(`Error applying step ${step}:`, error);
        }
    }

    // Apply step 1 (Create Show)
    function applyStep1() {
        if (!window.tvdbFetchedData) {
            throw new Error('No data available. Please fetch data first.');
        }

        const data = window.tvdbFetchedData;
        let filledCount = 0;

        // Fill IMDb field with proper URL format
        if (data.imdbId) {
            const imdbField = document.getElementById('imdb');
            if (imdbField) {
                // Ensure IMDb ID is in correct format (just the ID, not full URL)
                const imdbId = data.imdbId.startsWith('tt') ? data.imdbId : `tt${data.imdbId}`;
                fillField(imdbField, imdbId);
                log(`Filled IMDb field with: ${imdbId}`);
                filledCount++;
            } else {
                log('IMDb field not found');
            }
        }

        // Fill TMDB field with just the number
        if (data.tmdbId) {
            const tmdbField = document.getElementById('tmdb');
            if (tmdbField) {
                // Ensure TMDB ID is just the number
                const tmdbId = data.tmdbId.toString().replace(/\D/g, '');
                fillField(tmdbField, tmdbId);
                log(`Filled TMDB field with: ${tmdbId}`);
                filledCount++;
            } else {
                log('TMDB field not found');
            }
        }

        // Fill Official Site field
        if (data.officialSite) {
            const pressField = document.getElementById('press-release');
            if (pressField) {
                fillField(pressField, data.officialSite);
                log(`Filled Official Site field with: ${data.officialSite}`);
                filledCount++;
            } else {
                log('Official Site field not found');
            }
        }

        // Wait a bit for validation to process
        setTimeout(() => {
            log(`Step 1 applied. Filled ${filledCount} fields`);
            updateStatus(`Form filled with ${filledCount} fields. Check if validation passes...`);
        }, 500);
    }

    // Apply step 2 (Add Series)
    function applyStep2() {
        if (!window.tvdbFetchedData) {
            throw new Error('No data available. Please fetch data first.');
        }

        const data = window.tvdbFetchedData.tmdb;
        let filledCount = 0;

        // Fill language select
        if (data.originalLanguage) {
            const tvdbLanguage = LANGUAGE_MAP[data.originalLanguage];
            if (tvdbLanguage) {
                const langSelect = document.querySelector('select[name="language"]');
                if (langSelect) {
                    const option = Array.from(langSelect.options).find(opt =>
                        opt.value === tvdbLanguage || opt.textContent.includes(tvdbLanguage)
                    );
                    if (option) {
                        option.selected = true;
                        langSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                    }
                }
            }
        }

        // Fill name field with original language title
        if (data.originalName) {
            log(`Looking for name field to fill with: ${data.originalName}`);
            
            // The name field is a hidden input, but the actual input is in a React component
            // Try to find the React component input first
            let nameField = null;
            
            // Look for input inside the series-search-input div (React component)
            const seriesSearchDiv = document.getElementById('series-search-input');
            if (seriesSearchDiv) {
                // Wait a bit for React to render
                setTimeout(() => {
                    const reactInput = seriesSearchDiv.querySelector('input[type="text"]') || 
                                     seriesSearchDiv.querySelector('input') ||
                                     seriesSearchDiv.querySelector('[contenteditable="true"]');
                    if (reactInput) {
                        fillField(reactInput, data.originalName);
                        log(`✓ Filled React name field with: ${data.originalName}`);
                        filledCount++;
                    } else {
                        log('React input not found in series-search-input div');
                    }
                }, 500);
            }
            
            // Also fill the hidden input as backup
            const hiddenNameField = document.getElementById('name');
            if (hiddenNameField) {
                hiddenNameField.value = data.originalName;
                log(`✓ Filled hidden name field with: ${data.originalName}`);
                filledCount++;
            }
            
            // Try to find any other text input that might be the name field
            if (!nameField) {
                const allTextInputs = document.querySelectorAll('input[type="text"]');
                nameField = Array.from(allTextInputs).find(input => 
                    !input.value || input.value.trim() === ''
                );
                if (nameField) {
                    fillField(nameField, data.originalName);
                    log(`✓ Filled fallback name field with: ${data.originalName}`);
                    filledCount++;
                }
            }
            
            if (!nameField && !hiddenNameField) {
                log('❌ Name field not found. All text inputs:');
                const allTextInputs = document.querySelectorAll('input[type="text"]');
                allTextInputs.forEach((input, index) => {
                    const placeholder = input.placeholder || '';
                    const name = input.name || '';
                    const id = input.id || '';
                    const value = input.value || '';
                    log(`Text input ${index}: name="${name}", id="${id}", placeholder="${placeholder}", value="${value}"`);
                });
            }
        }

        // Fill overview field
        if (data.overview) {
            const overviewField = document.getElementById('overview');
            if (overviewField) {
                fillField(overviewField, data.overview);
                filledCount++;
            }
        }

        // Fill country select
        if (data.originCountry && data.originCountry.length > 0) {
            const countrySelect = document.querySelector('select[name="country"]');
            if (countrySelect) {
                const countryCode = data.originCountry[0];
                const countryName = COUNTRY_MAP[countryCode] || countryCode;
                log(`Looking for country: ${countryName} (code: ${countryCode})`);
                
                const option = Array.from(countrySelect.options).find(opt => {
                    const optionText = opt.textContent.toLowerCase();
                    const optionValue = opt.value.toLowerCase();
                    const searchCode = countryCode.toLowerCase();
                    
                    // Exact match on country code (e.g., 'ind' for India)
                    if (optionValue === searchCode) {
                        return true;
                    }
                    
                    // For India specifically, avoid "British Indian Ocean Territory"
                    if (searchCode === 'in' || searchCode === 'ind') {
                        return optionValue === 'ind' || (optionText === 'india' && optionValue !== 'iot');
                    }
                    
                    // For other countries, match by value
                    return optionValue === searchCode;
                });
                if (option) {
                    option.selected = true;
                    countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
                    log(`Filled Country field with: ${option.textContent}`);
                    filledCount++;
                } else {
                    log(`Country option not found for: ${countryName} (${countryCode})`);
                    log('Available options:', Array.from(countrySelect.options).map(opt => `${opt.value}: ${opt.textContent}`));
                    
                    // Try to find India specifically
                    const indiaOptions = Array.from(countrySelect.options).filter(opt => 
                        opt.textContent.toLowerCase().includes('india')
                    );
                    log('India-related options:', indiaOptions.map(opt => `${opt.value}: ${opt.textContent}`));
                }
            } else {
                log('Country select field not found');
            }
        }

        // Fill status select
        if (data.status) {
            const tvdbStatus = STATUS_MAP[data.status] || data.status;
            const statusSelect = document.querySelector('select[name="status"]');
            if (statusSelect) {
                const option = Array.from(statusSelect.options).find(opt =>
                    opt.value === tvdbStatus || opt.textContent.includes(tvdbStatus)
                );
                if (option) {
                    option.selected = true;
                    statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    filledCount++;
                }
            }
        }

        // Fill genres
        if (data.genres && data.genres.length > 0) {
            log(`Processing genres:`, data.genres.map(g => g.name || g));
            
            // Try multiple selectors for genre checkboxes
            const genreCheckboxes = document.querySelectorAll('input[type="checkbox"][name*="genre"], input[type="checkbox"][name*="Genre"], input[type="checkbox"][id*="genre"], input[type="checkbox"][id*="Genre"]');
            log(`Found ${genreCheckboxes.length} genre checkboxes`);
            
            if (genreCheckboxes.length === 0) {
                // Try alternative selectors
                const altCheckboxes = document.querySelectorAll('input[type="checkbox"]');
                log(`Found ${altCheckboxes.length} total checkboxes, looking for genre-related ones`);
                altCheckboxes.forEach((cb, index) => {
                    const label = cb.nextElementSibling?.textContent || cb.parentElement?.textContent || '';
                    if (label.toLowerCase().includes('genre') || label.toLowerCase().includes('action') || label.toLowerCase().includes('drama')) {
                        log(`Checkbox ${index}: ${cb.name || cb.id} - ${label}`);
                    }
                });
            }

            // Clear existing selections
            genreCheckboxes.forEach(cb => cb.checked = false);

            // Select mapped genres
            data.genres.forEach(genre => {
                const genreName = genre.name || genre;
                const tvdbGenre = GENRE_MAP[genreName];
                log(`Mapping genre: ${genreName} -> ${tvdbGenre}`);
                
                if (tvdbGenre) {
                    const checkbox = Array.from(genreCheckboxes).find(cb => {
                        const label = cb.nextElementSibling?.textContent || cb.parentElement?.textContent || '';
                        return cb.value === tvdbGenre || 
                               label.toLowerCase().includes(tvdbGenre.toLowerCase()) ||
                               label.toLowerCase().includes(genreName.toLowerCase());
                    });
                    
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        log(`Selected genre: ${tvdbGenre}`);
                        filledCount++;
                    } else {
                        log(`Genre checkbox not found for: ${tvdbGenre}`);
                    }
                } else {
                    log(`No mapping found for genre: ${genreName}`);
                }
            });
        }

        log(`Step 2 applied. Filled ${filledCount} fields`);
    }

    // Apply step 3 (Bulk Add Episodes) - EXACT copy from working script
    async function applyStep3() {
        if (!window.tvdbEpisodeData || !window.tvdbEpisodeData.episodes) {
            throw new Error('No episode data available. Please fetch episodes first.');
        }

        const episodes = window.tvdbEpisodeData.episodes;
        const seasonNum = 1; // We're on season 1
        
        log(`Filling ${episodes.length} episodes for season ${seasonNum}`);

        try {
            // Convert our episode data to the format expected by the working script
            const eps = episodes.map(ep => ({
                episode_number: ep.episodeNumber,
                name: ep.name,
                overview: ep.overview,
                air_date: ep.airDate,
                runtime: ep.runtime
            }));

            // Use the EXACT working logic
            await fillBulkTMDB({ id: window.tvdbEpisodeData.tmdbId }, eps, seasonNum);
            
            updateStatus(`Filled ${episodes.length} episodes successfully!`);
            log(`Step 3 completed. Filled ${episodes.length} episodes`);

        } catch (error) {
            updateStatus(`Error filling episodes: ${error.message}`);
            log('Error in applyStep3:', error);
        }
    }

    // EXACT copy of working bulk fill logic
    async function fillBulkTMDB(series, episodes, seasonNum) {
        if (!episodes || !Array.isArray(episodes)) {
            return log('No episode data available');
        }

        const eps = episodes.slice().sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
        const rtList = eps.map(e => e.runtime).filter(n => typeof n === 'number' && n > 0);
        const seasonAvg = rtList.length ? Math.round(rtList.reduce((a, b) => a + b, 0) / rtList.length) : 0;

        await ensureRows(eps.length);
        const rows = gatherRows();
        const count = Math.min(25, Math.min(rows.length, eps.length));

        for (let i = 0; i < count; i++) {
            const row = rows[i];
            const ep = eps[i];
            if (!row || !ep) continue;
            fillRow(row, {
                num: ep.episode_number,
                name: ep.name,
                overview: ep.overview,
                date: ep.air_date,
                runtime: ep.runtime || seasonAvg
            });
        }
        log(`Episodes filled (TMDB). Review, tweak, submit.`);
    }

    // EXACT copy from working script
    async function ensureRows(n) {
        const addBtn = Array.from(document.querySelectorAll('button')).find(b => 
            /add another/i.test(b.textContent || '')
        );
        const have = document.querySelectorAll('textarea').length;
        const need = Math.min(25, n);
        
        for (let i = have; i < need && addBtn; i++) {
            addBtn.click();
            await sleep(40);
        }
    }

    // EXACT copy from working script
    function gatherRows() {
        const tas = Array.from(document.querySelectorAll('textarea'));
        const rows = [];
        
        for (const ta of tas) {
            let p = ta;
            for (let i = 0; i < 6 && p; i++) {
                const labels = Array.from(p.querySelectorAll('label'));
                if (labels.some(l => /first aired/i.test(l.textContent || ''))) {
                    rows.push(p);
                    break;
                }
                p = p.parentElement;
            }
        }
        
        return rows;
    }

    // EXACT copy from working script with improved date handling
    function fillRow(root, { num, name, overview, date, runtime }) {
        const numEl = inputByLabelWithin(root, 'Episode #');
        const nameEl = inputByLabelWithin(root, 'Name');
        const airEl = inputByLabelWithin(root, 'First Aired');
        const runEl = inputByLabelWithin(root, 'Runtime');
        const ovEl = root.querySelector('textarea');

        if (numEl && num != null) {
            numEl.value = String(num || '');
            fire(numEl, 'input');
            fire(numEl, 'change');
        }
        
        if (nameEl) {
            nameEl.value = name || '';
            fire(nameEl, 'input');
            fire(nameEl, 'change');
        }
        
        if (ovEl) {
            ovEl.value = overview || '';
            fire(ovEl, 'input');
            fire(ovEl, 'change');
        }

        // Improved date handling - from working script
        if (airEl && date) {
            const isDate = (airEl.getAttribute('type') || '').toLowerCase() === 'date';
            
            // Incoming 'date' might be:
            // - 'yyyy-mm-dd' (TMDB)
            // - 'mm/dd/yyyy' (our OMDb converter or manual)
            // Convert to what the input expects.
            let out = date;
            if (isDate) {
                // force yyyy-mm-dd
                out = date.includes('/') ? toISO(date) : date;
            } else {
                // force mm/dd/yyyy
                out = date.includes('-') ? toUS(date) : date;
            }

            airEl.value = out;
            fire(airEl, 'input');
            fire(airEl, 'change');
        }

        if (runEl && runtime) {
            runEl.value = String(runtime);
            fire(runEl, 'input');
            fire(runEl, 'change');
        }
    }

    // EXACT copy from working script
    function inputByLabelWithin(root, label) {
        const labs = Array.from(root.querySelectorAll('label'));
        for (const L of labs) {
            const t = (L.textContent || '').toLowerCase();
            if (!t.includes(label.toLowerCase())) continue;
            
            const id = L.getAttribute('for');
            if (id) {
                const byId = root.querySelector('#' + CSS.escape(id));
                if (byId) return byId;
            }
            
            let el = L.nextElementSibling;
            for (let i = 0; i < 4 && el; i++) {
                if (/^(INPUT|TEXTAREA|SELECT)$/i.test(el.tagName)) return el;
                el = el.nextElementSibling;
            }
        }
        return null;
    }

    // EXACT copy from working script
    function fire(el, t) {
        if (el) el.dispatchEvent(new Event(t, { bubbles: true, cancelable: true }));
    }

    // EXACT copy from working script
    function toUS(ymd) {
        const [y, m, d] = (ymd || '').split('-');
        return (y && m && d) ? `${m}/${d}/${y}` : '';
    }

    // mm/dd/yyyy -> yyyy-mm-dd (from working script)
    function toISO(us) {
        const m = us.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!m) return us;
        const mm = m[1].padStart(2, '0');
        const dd = m[2].padStart(2, '0');
        const yy = m[3];
        return `${yy}-${mm}-${dd}`;
    }

    // EXACT copy from working script
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // Simplified episode form filling - based on working script
    function fillEpisodeFormSimple(episodeIndex, episode) {
        let filledCount = 0;
        
        log(`Filling episode ${episodeIndex + 1}: ${episode.name}`);
        
        // Get all episode rows - they should be in a table or similar structure
        const episodeRows = document.querySelectorAll('tr, .episode-row, .form-group');
        const targetRow = episodeRows[episodeIndex];
        
        if (!targetRow) {
            log(`Episode row ${episodeIndex + 1} not found`);
            return 0;
        }
        
        // Fill episode name - first text input in the row
        if (episode.name) {
            const nameInput = targetRow.querySelector('input[type="text"]');
            if (nameInput) {
                nameInput.value = episode.name;
                nameInput.dispatchEvent(new Event('input', {bubbles: true}));
                nameInput.dispatchEvent(new Event('change', {bubbles: true}));
                log(`✓ Filled name: ${episode.name}`);
                filledCount++;
            }
        }
        
        // Fill episode overview - textarea in the row
        if (episode.overview) {
            const overviewInput = targetRow.querySelector('textarea');
            if (overviewInput) {
                overviewInput.value = episode.overview;
                overviewInput.dispatchEvent(new Event('input', {bubbles: true}));
                overviewInput.dispatchEvent(new Event('change', {bubbles: true}));
                log(`✓ Filled overview`);
                filledCount++;
            }
        }
        
        // Fill air date - convert to MM/DD/YYYY format
        if (episode.airDate) {
            const dateInput = targetRow.querySelector('input[placeholder*="mm/dd/yyyy"], input[type="text"]:nth-of-type(3)');
            if (dateInput) {
                const date = new Date(episode.airDate);
                const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
                dateInput.value = formattedDate;
                dateInput.dispatchEvent(new Event('input', {bubbles: true}));
                dateInput.dispatchEvent(new Event('change', {bubbles: true}));
                log(`✓ Filled air date: ${formattedDate}`);
                filledCount++;
            }
        }
        
        // Fill runtime - number input
        if (episode.runtime && episode.runtime > 0) {
            const runtimeInput = targetRow.querySelector('input[type="number"], input[type="text"]:last-of-type');
            if (runtimeInput) {
                runtimeInput.value = episode.runtime.toString();
                runtimeInput.dispatchEvent(new Event('input', {bubbles: true}));
                runtimeInput.dispatchEvent(new Event('change', {bubbles: true}));
                log(`✓ Filled runtime: ${episode.runtime} minutes`);
                filledCount++;
            }
        }
        
        log(`Episode ${episodeIndex + 1} filled: ${filledCount} fields`);
        return filledCount;
    }

    // Fill individual episode form
    function fillEpisodeForm(episodeIndex, episode) {
        let filledCount = 0;
        
        log(`Looking for episode form ${episodeIndex + 1}`);
        
        // Find all episode forms - try multiple selectors
        const allForms = document.querySelectorAll('.form-group, .episode-form, [data-episode-index], tr, .row');
        log(`Found ${allForms.length} total forms`);
        
        // Debug: Log all forms to understand structure
        allForms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input, textarea');
            log(`Form ${index}: ${inputs.length} inputs found`);
        });
        
        // For the first episode, use the first form
        // For subsequent episodes, try to find forms that might be empty or newly created
        let targetForm;
        
        if (episodeIndex === 0) {
            targetForm = allForms[0];
        } else {
            // Look for forms that might be empty or have default values
            targetForm = Array.from(allForms).find(form => {
                const textInputs = form.querySelectorAll('input[type="text"]');
                const textareas = form.querySelectorAll('textarea');
                const allInputs = [...textInputs, ...textareas];
                
                // Check if form has empty inputs
                return allInputs.some(input => !input.value || input.value.trim() === '');
            });
            
            // If no empty form found, use the form at the episode index
            if (!targetForm && allForms[episodeIndex]) {
                targetForm = allForms[episodeIndex];
            }
        }
        
        if (!targetForm) {
            log(`Episode form ${episodeIndex + 1} not found`);
            return 0;
        }

        log(`Using form for episode ${episodeIndex + 1}`);
        
        // Debug: Log all inputs in the target form
        const allInputs = targetForm.querySelectorAll('input, textarea');
        log(`Target form has ${allInputs.length} inputs:`);
        allInputs.forEach((input, index) => {
            log(`  Input ${index}: type="${input.type}", name="${input.name}", placeholder="${input.placeholder}", value="${input.value}"`);
        });

        // Fill episode name - look for text input with name placeholder or similar
        if (episode.name) {
            const nameField = targetForm.querySelector('input[type="text"]') || 
                             targetForm.querySelector('input[name*="name"]') ||
                             targetForm.querySelector('input[placeholder*="name" i]') ||
                             targetForm.querySelector('input[placeholder*="telugu" i]');
            if (nameField) {
                fillField(nameField, episode.name);
                log(`✓ Filled episode ${episodeIndex + 1} name: ${episode.name}`);
                filledCount++;
            } else {
                log(`❌ Name field not found for episode ${episodeIndex + 1}`);
                // Try to find any text input
                const anyTextInput = targetForm.querySelector('input[type="text"]');
                if (anyTextInput) {
                    log(`Trying first text input for name`);
                    fillField(anyTextInput, episode.name);
                    filledCount++;
                }
            }
        }

        // Fill episode overview - look for textarea
        if (episode.overview) {
            const overviewField = targetForm.querySelector('textarea') ||
                                 targetForm.querySelector('input[name*="overview"]') ||
                                 targetForm.querySelector('input[placeholder*="overview" i]');
            if (overviewField) {
                fillField(overviewField, episode.overview);
                log(`✓ Filled episode ${episodeIndex + 1} overview`);
                filledCount++;
            } else {
                log(`❌ Overview field not found for episode ${episodeIndex + 1}`);
            }
        }

        // Fill air date - look for date input
        if (episode.airDate) {
            const airDateField = targetForm.querySelector('input[type="date"]') ||
                                targetForm.querySelector('input[placeholder*="date" i]') ||
                                targetForm.querySelector('input[name*="air" i]') ||
                                targetForm.querySelector('input[placeholder*="first" i]') ||
                                targetForm.querySelector('input[placeholder*="mm/dd/yyyy" i]');
            if (airDateField) {
                // Convert date format from YYYY-MM-DD to MM/DD/YYYY
                const date = new Date(episode.airDate);
                const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
                fillField(airDateField, formattedDate);
                log(`✓ Filled episode ${episodeIndex + 1} air date: ${formattedDate}`);
                filledCount++;
            } else {
                log(`❌ Air date field not found for episode ${episodeIndex + 1}`);
            }
        }

        // Fill runtime - look for number input
        if (episode.runtime && episode.runtime > 0) {
            const runtimeField = targetForm.querySelector('input[name*="runtime" i]') ||
                                targetForm.querySelector('input[placeholder*="runtime" i]') ||
                                targetForm.querySelector('input[type="number"]');
            if (runtimeField) {
                fillField(runtimeField, episode.runtime.toString());
                log(`✓ Filled episode ${episodeIndex + 1} runtime: ${episode.runtime} minutes`);
                filledCount++;
            } else {
                log(`❌ Runtime field not found for episode ${episodeIndex + 1}`);
            }
        }

        log(`Episode ${episodeIndex + 1} filled: ${filledCount} fields`);
        return filledCount;
    }

    // Apply step 4 (Upload Poster)
    function applyStep4() {
        log('Step 4 (Upload Poster) - Applying poster upload');
        
        try {
            // Get selected poster
            const selectedPoster = window.tvdbFetchedData?.selectedPoster;
            if (!selectedPoster) {
                updateStatus('No poster selected. Please fetch and select a poster first.');
                return;
            }
            
            log(`Using selected poster: ${selectedPoster.file_path}`);
            
            // Construct the full poster URL
            const posterUrl = selectedPoster.file_path.startsWith('http') 
                ? selectedPoster.file_path 
                : `https://image.tmdb.org/t/p/original${selectedPoster.file_path}`;
            
            log(`Poster URL: ${posterUrl}`);
            
            // Debug: Log all input fields on the page
            const allInputs = document.querySelectorAll('input, select');
            log('🔍 All form fields on page:');
            allInputs.forEach((input, index) => {
                const type = input.type || input.tagName;
                const name = input.name || 'no-name';
                const id = input.id || 'no-id';
                const placeholder = input.placeholder || 'no-placeholder';
                log(`  ${index}: ${type} name="${name}" id="${id}" placeholder="${placeholder}"`);
            });
            
            // Fill the URL field - try multiple selectors for TVDB poster upload
            const urlField = document.querySelector('input[placeholder*="URL"]') || 
                            document.querySelector('input[placeholder*="url"]') ||
                            document.querySelector('input[name*="url"]') ||
                            document.querySelector('input[id*="url"]') ||
                            document.querySelector('input[type="text"]:not([placeholder*="file"])');
            
            if (urlField) {
                fillField(urlField, posterUrl);
                log(`Filled URL field with: ${posterUrl}`);
            } else {
                log('Could not find URL field');
                updateStatus('Could not find URL field to fill');
            }
            
            // Fill the language field - try multiple selectors for TVDB poster upload
            const languageField = document.querySelector('select[name*="language"]') ||
                                 document.querySelector('select[id*="language"]') ||
                                 document.querySelector('select[placeholder*="language"]') ||
                                 document.querySelector('input[name*="language"]') ||
                                 document.querySelector('input[id*="language"]') ||
                                 document.querySelector('select:not([name*="file"])');
            
            if (languageField) {
                // Try to determine language from poster or use TV show's original language
                let languageValue = 'en'; // Fallback to English
                
                // First try to get the TV show's original language
                let tmdbLanguage = null;
                
                // Debug: Log all available language data
                log('🔍 Available language data:');
                log(`  window.tvdbFetchedData?.tmdb?.originalLanguage: ${window.tvdbFetchedData?.tmdb?.originalLanguage}`);
                log(`  window.tvdbFetchedData?.originalLanguage: ${window.tvdbFetchedData?.originalLanguage}`);
                log(`  context.originalIso1: ${context.originalIso1}`);
                log(`  selectedPoster.iso_639_1: ${selectedPoster.iso_639_1}`);
                
                if (context.originalIso1) {
                    tmdbLanguage = context.originalIso1;
                    log(`✅ Using context original language: ${tmdbLanguage}`);
                } else if (window.tvdbFetchedData?.tmdb?.originalLanguage) {
                    tmdbLanguage = window.tvdbFetchedData.tmdb.originalLanguage;
                    log(`✅ Using TV show original language: ${tmdbLanguage}`);
                } else if (window.tvdbFetchedData?.originalLanguage) {
                    tmdbLanguage = window.tvdbFetchedData.originalLanguage;
                    log(`✅ Using stored original language: ${tmdbLanguage}`);
                } else if (selectedPoster.iso_639_1) {
                    tmdbLanguage = selectedPoster.iso_639_1;
                    log(`✅ Using poster language: ${tmdbLanguage}`);
                } else {
                    log('❌ No language found, using fallback: en');
                    tmdbLanguage = 'en';
                }
                
                // Map TMDB language code to TVDB language code
                languageValue = mapLanguageCode(tmdbLanguage);
                log(`Mapped language: ${tmdbLanguage} -> ${languageValue}`);
                
                // If it's a select dropdown, try to find matching option
                if (languageField.tagName === 'SELECT') {
                    const options = languageField.querySelectorAll('option');
                    log(`🔍 Looking for language "${languageValue}" in ${options.length} options:`);
                    
                    // Log all available options for debugging
                    options.forEach((opt, index) => {
                        log(`  Option ${index}: value="${opt.value}" text="${opt.textContent}"`);
                    });
                    
                    let found = false;
                    for (const option of options) {
                        // Try exact match first
                        if (option.value === languageValue) {
                            languageField.value = option.value;
                            languageField.dispatchEvent(new Event('change'));
                            log(`✅ Exact match found: ${option.textContent} (${option.value})`);
                            found = true;
                            break;
                        }
                    }
                    
                    // If no exact match, try partial match
                    if (!found) {
                        for (const option of options) {
                            // Try partial match on value
                            if (option.value.toLowerCase().includes(languageValue.toLowerCase())) {
                                languageField.value = option.value;
                                languageField.dispatchEvent(new Event('change'));
                                log(`✅ Partial value match found: ${option.textContent} (${option.value})`);
                                found = true;
                                break;
                            }
                            // Try partial match on text content
                            else if (option.textContent.toLowerCase().includes(languageValue.toLowerCase())) {
                                languageField.value = option.value;
                                languageField.dispatchEvent(new Event('change'));
                                log(`✅ Partial text match found: ${option.textContent} (${option.value})`);
                                found = true;
                                break;
                            }
                        }
                    }
                    
                    // If still no match, try to find Telugu specifically
                    if (!found && tmdbLanguage === 'te') {
                        for (const option of options) {
                            if (option.textContent.toLowerCase().includes('telugu') || 
                                option.value.toLowerCase().includes('tel') ||
                                option.textContent.toLowerCase().includes('తెలుగు')) {
                                languageField.value = option.value;
                                languageField.dispatchEvent(new Event('change'));
                                log(`✅ Telugu-specific match found: ${option.textContent} (${option.value})`);
                                found = true;
                                break;
                            }
                        }
                    }
                    
                    if (!found) {
                        log(`❌ No language match found for "${languageValue}", using first available option`);
                        if (options.length > 0) {
                            languageField.value = options[0].value;
                            languageField.dispatchEvent(new Event('change'));
                            log(`Selected first option: ${options[0].textContent}`);
                        }
                    }
                } else {
                    // For input fields, just set the value
                    fillField(languageField, languageValue);
                }
                
                log(`Filled language field with: ${languageValue}`);
            } else {
                log('Could not find language field');
                updateStatus('Could not find language field to fill');
            }
            
            updateStatus(`Poster URL filled: ${posterUrl}`);
            log('Step 4 form fields filled successfully');
            
        } catch (error) {
            log('Error in applyStep4:', error);
            updateStatus(`Error: ${error.message}`);
        }
    }

    // Apply step 5 (English Translation)
    function applyStep5() {
        log('Step 5 (English Translation) - Applying translation');
        
        try {
            // Get translation source
            const translationSource = document.getElementById('tvdb-translation-source')?.value || 'tmdb';
            log(`Using translation source: ${translationSource}`);
            
            // Debug: Log available data
            log('🔍 Available translation data:');
            log(`  window.tvdbFetchedData?.tmdbData: ${!!window.tvdbFetchedData?.tmdbData}`);
            log(`  window.tvdbFetchedData?.omdbData: ${!!window.tvdbFetchedData?.omdbData}`);
            log(`  window.tvdbFetchedData?.tmdbId: ${window.tvdbFetchedData?.tmdbId}`);
            log(`  window.tvdbFetchedData?.imdbId: ${window.tvdbFetchedData?.imdbId}`);
            
            // Check for translation data from fetchTranslation function
            const translationData = window.tvdbFetchedData?.translationData;
            if (translationData) {
                log(`Using fetched translation data: name="${translationData.name}", overview="${translationData.overview ? translationData.overview.substring(0, 50) + '...' : 'None'}"`);
                fillTranslationFields(translationData.name, translationData.overview);
                updateStatus(`${translationData.source} English translation applied`);
            } else if (translationSource === 'tmdb' && window.tvdbFetchedData?.tmdbId) {
                // Use TMDB English data from original fetch
                const tmdbData = window.tvdbFetchedData.tmdbData;
                if (tmdbData) {
                    log(`TMDB data: name="${tmdbData.name}", overview="${tmdbData.overview ? tmdbData.overview.substring(0, 50) + '...' : 'None'}"`);
                    // Fill English translation fields
                    fillTranslationFields(tmdbData.name, tmdbData.overview);
                    updateStatus('TMDB English translation applied');
                } else {
                    log('❌ No TMDB data available');
                    updateStatus('No TMDB data available. Please fetch data first.');
                }
            } else if (translationSource === 'omdb' && window.tvdbFetchedData?.imdbId) {
                // Use OMDb English data from original fetch
                const omdbData = window.tvdbFetchedData.omdbData;
                if (omdbData) {
                    log(`OMDb data: Title="${omdbData.Title}", Plot="${omdbData.Plot ? omdbData.Plot.substring(0, 50) + '...' : 'None'}"`);
                    fillTranslationFields(omdbData.Title, omdbData.Plot);
                    updateStatus('OMDb English translation applied');
                } else {
                    log('❌ No OMDb data available');
                    updateStatus('No OMDb data available. Please fetch data first.');
                }
            } else {
                log('❌ No translation data available');
                updateStatus('No translation data available. Please fetch translation first.');
            }
            
            log('Step 5 applied successfully');
        } catch (error) {
            log('Error in applyStep5:', error);
            updateStatus(`Error: ${error.message}`);
        }
    }

    // Fill translation fields
    function fillTranslationFields(name, overview) {
        log('🔍 Filling translation fields...');
        log(`Series name: ${name}`);
        log(`Series overview: ${overview ? overview.substring(0, 100) + '...' : 'None'}`);
        
        // Debug: Log all form fields on the page
        const allInputs = document.querySelectorAll('input, textarea, select');
        log('🔍 All form fields on translation page:');
        allInputs.forEach((input, index) => {
            const type = input.type || input.tagName;
            const name = input.name || 'no-name';
            const id = input.id || 'no-id';
            const placeholder = input.placeholder || 'no-placeholder';
            log(`  ${index}: ${type} name="${name}" id="${id}" placeholder="${placeholder}"`);
        });
        
        // Find and fill series name field - try multiple selectors
        const nameField = document.querySelector('input[name="name"]') ||
                         document.querySelector('input[name*="name"]') ||
                         document.querySelector('#name') ||
                         document.querySelector('input[placeholder*="name" i]') ||
                         document.querySelector('input[placeholder*="title" i]') ||
                         document.querySelector('input[type="text"]:not([name*="episode"])');
        
        if (nameField && name) {
            fillField(nameField, name);
            log(`✅ Filled series name: ${name}`);
        } else {
            log('❌ Could not find series name field');
        }
        
        // Find and fill overview field - try multiple selectors
        const overviewField = document.querySelector('textarea[name="overview"]') ||
                             document.querySelector('textarea[name*="overview"]') ||
                             document.querySelector('#overview') ||
                             document.querySelector('textarea[placeholder*="overview" i]') ||
                             document.querySelector('textarea[placeholder*="description" i]') ||
                             document.querySelector('textarea');
        
        if (overviewField && overview) {
            fillField(overviewField, overview);
            log(`✅ Filled series overview`);
        } else {
            log('❌ Could not find series overview field');
        }
        
        // Fill episode translations if available
        if (window.tvdbEpisodeData && window.tvdbEpisodeData.episodes) {
            const episodes = window.tvdbEpisodeData.episodes;
            episodes.forEach((episode, index) => {
                // Find episode name field
                const episodeNameField = document.querySelector(`input[name="episodes[${index}][name]"], input[data-episode="${index}"][name*="name"]`);
                if (episodeNameField && episode.name) {
                    fillField(episodeNameField, episode.name);
                    log(`✓ Filled episode ${index + 1} name: ${episode.name}`);
                }
                
                // Find episode overview field
                const episodeOverviewField = document.querySelector(`textarea[name="episodes[${index}][overview]"], textarea[data-episode="${index}"][name*="overview"]`);
                if (episodeOverviewField && episode.overview) {
                    fillField(episodeOverviewField, episode.overview);
                    log(`✓ Filled episode ${index + 1} overview`);
                }
            });
        }
    }

    // Apply and continue to next step
    function applyAndContinue(step) {
        log(`🚀 Apply & Continue for step: ${step}`);
        
        // Apply the step first
        try {
            applyStep(step);
            log(`✅ Step ${step} applied successfully`);
        } catch (error) {
            log(`❌ Error applying step ${step}:`, error);
            updateStatus(`Error applying step: ${error.message}`);
            return;
        }

        // Wait for form validation to complete before clicking Continue
        setTimeout(() => {
            log('🔍 Looking for Continue button...');
            const continueBtn = findContinueButton();
            if (continueBtn) {
                log(`✅ Found Continue button: ${continueBtn.textContent || continueBtn.value}`);
                log('🖱️ Clicking page Continue button');
                
                // Wait a bit more for any validation to complete
                setTimeout(() => {
                    try {
                        continueBtn.click();
                        updateStatus('Form filled and Continue button clicked!');
                        log('✅ Continue button clicked successfully');
                        
                        // Check if validation gets stuck
                        setTimeout(() => {
                            checkValidationStatus();
                        }, 3000);
                    } catch (error) {
                        log('❌ Error clicking Continue button:', error);
                        updateStatus('Error clicking Continue button. Please click manually.');
                    }
                }, 1000);
            } else {
                updateStatus('Form filled, but Continue button not found. Please click Continue manually.');
                log('❌ Continue button not found on page');
                log('🔍 Available buttons on page:');
                const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
                allButtons.forEach((btn, index) => {
                    const text = btn.textContent || btn.value || '';
                    log(`  Button ${index}: "${text}" (${btn.tagName})`);
                });
            }
        }, 1000);
    }
    
    // Check if validation is stuck
    function checkValidationStatus() {
        const checkingElement = document.querySelector('*:contains("Checking values")') || 
                               Array.from(document.querySelectorAll('*')).find(el => 
                                   el.textContent && el.textContent.includes('Checking values'));
        
        if (checkingElement) {
            updateStatus('Validation appears stuck. Try refreshing the page or check the form data.');
            log('Validation appears to be stuck - checking values message still visible');
            
            // Add a manual override button
            addManualOverrideButton();
        } else {
            updateStatus('Validation completed successfully!');
        }
    }
    
    // Add manual override button when validation is stuck
    function addManualOverrideButton() {
        const statusDiv = document.getElementById('tvdb-status');
        if (statusDiv && !document.getElementById('tvdb-manual-override')) {
            const overrideBtn = document.createElement('button');
            overrideBtn.id = 'tvdb-manual-override';
            overrideBtn.textContent = 'Force Continue (if stuck)';
            overrideBtn.style.cssText = `
                background: #ff6b6b; color: white; border: none; border-radius: 4px; 
                padding: 5px 10px; cursor: pointer; margin-top: 5px; font-size: 12px;
            `;
            overrideBtn.onclick = () => {
                const continueBtn = findContinueButton();
                if (continueBtn) {
                    continueBtn.click();
                    updateStatus('Force clicked Continue button');
                } else {
                    updateStatus('Continue button not found for force click');
                }
            };
            statusDiv.appendChild(overrideBtn);
        }
    }

    // Find the page's Continue button
    function findContinueButton() {
        log('🔍 Looking for Continue button...');
        
        // For Step 3, look specifically for "Add Episodes" button
        const currentStep = getCurrentStep();
        if (currentStep === 'step3') {
            log('🔍 Step 3 detected - looking for "Add Episodes" button...');
            
            const addEpisodesBtn = document.querySelector('button:contains("Add Episodes")') ||
                                 Array.from(document.querySelectorAll('button')).find(btn => 
                                     btn.textContent && btn.textContent.includes('Add Episodes')
                                 );
            
            if (addEpisodesBtn) {
                log(`✅ Found Add Episodes button: "${addEpisodesBtn.textContent}"`);
                return addEpisodesBtn;
            } else {
                log('❌ Add Episodes button not found');
            }
        }
        
        // Try multiple selectors for the Continue button
        const selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'input[value*="Continue"]',
            '.btn-primary',
            '.btn-success',
            'button.btn',
            'form button',
            'form input[type="submit"]',
            'button',
            'input[type="button"]'
        ];

        for (const selector of selectors) {
            const buttons = document.querySelectorAll(selector);
            log(`🔍 Checking selector "${selector}": found ${buttons.length} elements`);
            
            for (const btn of buttons) {
                const text = btn.textContent || btn.value || '';
                log(`🔍 Button text: "${text}"`);
                if (text.toLowerCase().includes('continue') || text.toLowerCase().includes('next') || text.toLowerCase().includes('submit')) {
                    log(`✅ Found Continue button: "${text}"`);
                    return btn;
                }
            }
        }
        
        // Also search all buttons for text content
        const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        log(`🔍 Checking all ${allButtons.length} buttons for Continue text...`);
        
        for (const btn of allButtons) {
            const text = (btn.textContent || btn.value || '').toLowerCase();
            if (text.includes('continue') || text.includes('next') || text.includes('submit') || text.includes('proceed')) {
                log(`✅ Found Continue button by text search: "${text}"`);
                return btn;
            }
        }

        // Fallback: look for any button with "Continue" text
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (const btn of buttons) {
            if (btn.textContent?.toLowerCase().includes('continue') ||
                btn.value?.toLowerCase().includes('continue')) {
                return btn;
            }
        }

        return null;
    }

    // Skip step
    function skipStep(step) {
        updateStatus(`Skipped ${getStepName(step)}`);
        log(`Skipped step: ${step}`);
    }

    // Get next step
    function getNextStep(currentStep) {
        const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
        const currentIndex = steps.indexOf(currentStep);
        return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
    }

    // Get step URL
    function getStepUrl(step) {
        const baseUrl = 'https://thetvdb.com';
        switch (step) {
            case 'step1': return `${baseUrl}/series/create`;
            case 'step2': return `${baseUrl}/series/create-step2`;
            case 'step3': return `${baseUrl}/series/${context.seriesSlug}/seasons/official/1/bulkadd`;
            case 'step4': return `${baseUrl}/artwork/upload?type=2&series=${context.seriesId}`;
            case 'step5': return `${baseUrl}/series/${context.seriesId}/translate/eng`;
            default: return baseUrl;
        }
    }

    // Helper function to fill a field with human-like behavior
    function fillField(field, value) {
        try {
            log(`Filling field with: ${value}`);

            // Human-like delay before starting
            const delay = Math.random() * 200 + 100; // 100-300ms
            
            setTimeout(() => {
                // Focus the field naturally
                field.focus();
                
                // Clear existing value with human-like behavior
                field.value = '';
                field.setAttribute('value', '');
                
                // Simulate human typing with delays
                let currentValue = '';
                let index = 0;
                
                const typeChar = () => {
                    if (index < value.length) {
                        currentValue += value[index];
                        field.value = currentValue;
                        field.setAttribute('value', currentValue);
                        
                        // Trigger input event for each character
                        field.dispatchEvent(new Event('input', { 
                            bubbles: true, 
                            cancelable: true,
                            isTrusted: true
                        }));
                        
                        index++;
                        
                        // Random delay between characters (human-like)
                        const charDelay = Math.random() * 50 + 20; // 20-70ms
                        setTimeout(typeChar, charDelay);
                    } else {
                        // Finished typing, trigger final events
                        field.dispatchEvent(new Event('change', { 
                            bubbles: true, 
                            cancelable: true,
                            isTrusted: true
                        }));
                        field.dispatchEvent(new Event('blur', { 
                            bubbles: true, 
                            cancelable: true,
                            isTrusted: true
                        }));
                        
                        // Human-like pause before moving to next field
                        setTimeout(() => {
                            log(`✓ Field filled with: ${value}`);
                        }, Math.random() * 200 + 100);
                    }
                };
                
                // Start typing
                typeChar();
                
            }, delay);

        } catch (error) {
            log(`Error filling field: ${error.message}`);
        }
    }

    // Clear form function
    function clearForm() {
        log('Clearing form...');
        updateStatus('Clearing form...');
        
        const fields = ['imdb', 'tmdb', 'press-release'];
        let clearedCount = 0;
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                field.setAttribute('value', '');
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
                clearedCount++;
            }
        });
        
        updateStatus(`Form cleared. ${clearedCount} fields cleared.`);
        log(`Form cleared. ${clearedCount} fields cleared.`);
    }
    
    // Retry fill function
    function retryFill() {
        log('Retrying form fill...');
        updateStatus('Retrying form fill...');
        
        // Clear form first
        clearForm();
        
        // Wait a bit then refill
        setTimeout(() => {
            applyStep1();
            updateStatus('Form refilled. Try clicking Continue manually.');
        }, 500);
    }

    // Placeholder functions for other steps
    async function fetchPosters() {
        const tmdbId = document.getElementById('tvdb-tmdb-id-step4')?.value || window.tvdbFetchedData?.tmdbId;
        const imdbId = window.tvdbFetchedData?.imdbId || document.getElementById('tvdb-imdb-id-step3')?.value;
        const posterSource = document.getElementById('tvdb-poster-source')?.value || 'tmdb';

        if (!tmdbId && !imdbId) {
            updateStatus('Please provide TMDB ID or IMDb ID first');
            return;
        }

        updateStatus('Fetching posters...');
        log(`Fetching posters from ${posterSource} for TMDB ID: ${tmdbId}, IMDb ID: ${imdbId}`);

        try {
            let posterData = [];
            let selectedPoster = null;

            if (posterSource === 'tmdb' && tmdbId) {
                // Fetch posters from TMDB
                const response = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/images?api_key=${CONFIG.tmdbApiKey}`);
                if (response.ok) {
                    const data = await response.json();
                    posterData = data.posters || [];
                    log(`Found ${posterData.length} TMDB posters`);
                } else {
                    throw new Error(`TMDB API error: ${response.status}`);
                }
            } else if (posterSource === 'omdb' && imdbId) {
                // Fetch poster from OMDb
                const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${CONFIG.omdbApiKey}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.Poster && data.Poster !== 'N/A') {
                        posterData = [{
                            file_path: data.Poster,
                            vote_average: 0,
                            vote_count: 0,
                            width: 0,
                            height: 0,
                            iso_639_1: 'en',
                            aspect_ratio: 0.68
                        }];
                        log(`Found OMDb poster: ${data.Poster}`);
                    }
                } else {
                    throw new Error(`OMDb API error: ${response.status}`);
                }
            }

            if (posterData.length > 0) {
                // Sort posters by quality (vote count + resolution)
                const sortedPosters = posterData.sort((a, b) => 
                    (b.vote_count || 0) - (a.vote_count || 0) || 
                    (b.width || 0) - (a.width || 0)
                );

                selectedPoster = sortedPosters[0];
                log(`Selected best poster: ${selectedPoster.file_path}`);

                // Store poster data globally
                window.tvdbFetchedData = window.tvdbFetchedData || {};
                window.tvdbFetchedData.posterData = sortedPosters;
                window.tvdbFetchedData.selectedPoster = selectedPoster;

                // Update preview
                updatePosterPreview(selectedPoster, sortedPosters);
                updateStatus(`Found ${posterData.length} posters. Best poster selected.`);
            } else {
                updateStatus('No posters found. Please try a different source or manual upload.');
            }

        } catch (error) {
            log('Error fetching posters:', error);
            updateStatus(`Error fetching posters: ${error.message}`);
        }
    }

    // Update poster preview
    function updatePosterPreview(selectedPoster, allPosters) {
        const previewDiv = document.getElementById('tvdb-poster-preview');
        if (!previewDiv) return;

        const posterUrl = selectedPoster.file_path.startsWith('http') 
            ? selectedPoster.file_path 
            : `https://image.tmdb.org/t/p/w500${selectedPoster.file_path}`;

        previewDiv.innerHTML = `
            <div style="color: #ccc; font-size: 12px; margin-bottom: 6px;">Selected Poster:</div>
            <div style="text-align: center;">
                <img src="${posterUrl}" style="max-width: 150px; max-height: 200px; border: 1px solid #555; border-radius: 4px;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; color: #ff6b6b; font-size: 11px;">Image failed to load</div>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #ccc;">
                <div>Resolution: ${selectedPoster.width || 'Unknown'}x${selectedPoster.height || 'Unknown'}</div>
                <div>Vote Count: ${selectedPoster.vote_count || 0}</div>
                <div>Language: ${selectedPoster.iso_639_1 || 'Unknown'}</div>
                <div style="margin-top: 4px;">
                    <button onclick="selectPoster(0)" style="background: #4CAF50; color: white; border: none; border-radius: 3px; padding: 3px 6px; font-size: 9px; cursor: pointer;">Select This Poster</button>
                </div>
            </div>
            ${allPosters.length > 1 ? `
                <div style="margin-top: 8px; font-size: 10px; color: #ccc;">
                    <div>Other options (${allPosters.length - 1} more):</div>
                    <div style="max-height: 80px; overflow-y: auto; margin-top: 4px;">
                        ${allPosters.slice(1, 4).map((poster, index) => {
                            const thumbUrl = poster.file_path.startsWith('http') 
                                ? poster.file_path 
                                : `https://image.tmdb.org/t/p/w200${poster.file_path}`;
                            return `
                                <div style="display: inline-block; margin: 1px; text-align: center;">
                                    <img src="${thumbUrl}" style="width: 40px; height: 60px; object-fit: cover; border: 1px solid #555; border-radius: 2px; cursor: pointer;" 
                                         onclick="selectPoster(${index + 1})" 
                                         title="Votes: ${poster.vote_count || 0}, ${poster.width || '?'}x${poster.height || '?'}">
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // Add global function for poster selection
        window.selectPoster = (index) => {
            if (window.tvdbFetchedData?.posterData && window.tvdbFetchedData.posterData[index]) {
                const newPoster = window.tvdbFetchedData.posterData[index];
                window.tvdbFetchedData.selectedPoster = newPoster;
                updatePosterPreview(newPoster, window.tvdbFetchedData.posterData);
                log(`Selected poster ${index + 1}: ${newPoster.file_path}`);
                updateStatus(`Selected poster ${index + 1} of ${window.tvdbFetchedData.posterData.length}`);
            }
        };
    }

    async function fetchTranslation() {
        const tmdbId = document.getElementById('tvdb-tmdb-id-step5')?.value || window.tvdbFetchedData?.tmdbId;
        const imdbId = window.tvdbFetchedData?.imdbId || document.getElementById('tvdb-imdb-id-step3')?.value;
        const translationSource = document.getElementById('tvdb-translation-source')?.value || 'tmdb';

        if (!tmdbId && !imdbId) {
            updateStatus('Please provide TMDB ID or IMDb ID first');
            return;
        }

        updateStatus('Fetching translation data...');
        log(`Fetching translation from ${translationSource} for TMDB ID: ${tmdbId}, IMDb ID: ${imdbId}`);

        try {
            let translationData = null;

            if (translationSource === 'tmdb' && tmdbId) {
                // Fetch English data from TMDB
                const response = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${CONFIG.tmdbApiKey}&language=en-US`);
                if (response.ok) {
                    const data = await response.json();
                    translationData = {
                        name: data.name,
                        overview: data.overview,
                        source: 'TMDB'
                    };
                    log(`Found TMDB English translation: ${data.name}`);
                } else {
                    throw new Error(`TMDB API error: ${response.status}`);
                }
            } else if (translationSource === 'omdb' && imdbId) {
                // Fetch English data from OMDb
                const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${CONFIG.omdbApiKey}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.Response !== 'False') {
                        translationData = {
                            name: data.Title,
                            overview: data.Plot !== 'N/A' ? data.Plot : '',
                            source: 'OMDb'
                        };
                        log(`Found OMDb English translation: ${data.Title}`);
                    }
                } else {
                    throw new Error(`OMDb API error: ${response.status}`);
                }
            }

            if (translationData) {
                // Store translation data globally
                window.tvdbFetchedData = window.tvdbFetchedData || {};
                window.tvdbFetchedData.translationData = translationData;

                // Update preview
                updateTranslationPreview(translationData);
                updateStatus(`Found ${translationData.source} English translation: ${translationData.name}`);
            } else {
                updateStatus('No translation data found. Please try a different source or manual entry.');
            }

        } catch (error) {
            log('Error fetching translation:', error);
            updateStatus(`Error fetching translation: ${error.message}`);
        }
    }

    // Update translation preview
    function updateTranslationPreview(translationData) {
        const previewDiv = document.getElementById('tvdb-translation-preview');
        if (!previewDiv) return;

        previewDiv.innerHTML = `
            <div style="color: #ccc; font-size: 12px; margin-bottom: 8px;">Translation preview:</div>
            <div style="background: #222; padding: 8px; border-radius: 4px; font-size: 11px; color: #ccc;">
                <div><strong>Source:</strong> ${translationData.source}</div>
                <div><strong>Series Name:</strong> <span id="preview-series-name">${translationData.name || 'N/A'}</span></div>
                <div><strong>Overview:</strong> <span id="preview-overview">${translationData.overview ? translationData.overview.substring(0, 100) + '...' : 'N/A'}</span></div>
            </div>
        `;
    }

    // Manual fill function for stealth mode
    function manualFill(tmdbId, imdbId) {
        if (!tmdbId || !imdbId) {
            console.log('Please provide both TMDB ID and IMDb ID');
            return;
        }
        
        console.log('Manual fill started...');
        
        // Fill IMDb field
        const imdbField = document.getElementById('imdb');
        if (imdbField) {
            fillField(imdbField, imdbId);
        }
        
        // Wait a bit then fill TMDB field
        setTimeout(() => {
            const tmdbField = document.getElementById('tmdb');
            if (tmdbField) {
                fillField(tmdbField, tmdbId);
            }
        }, 1000);
        
        console.log('Manual fill completed. Check the form and click Continue manually.');
    }
    
    // Expose manual fill function globally for stealth mode
    window.tvdbManualFill = manualFill;
    
    // Expose show panel function globally
    window.tvdbShowPanel = () => {
        createUI();
        console.log('TVDB Helper panel shown');
    };

    // Start the script
    waitForPage();

})();
