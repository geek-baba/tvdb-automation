// ==UserScript==
// @name         TVDB Workflow Helper - Complete
// @namespace    tvdb.workflow
// @version      1.8.9
// @description  Complete TVDB 5-step workflow helper with TMDB/OMDb/Hoichoi integration and flexible data source modes
// @author       you
// @match        https://thetvdb.com/series/create*
// @match        https://thetvdb.com/series/create/*
// @match        https://thetvdb.com/series/create-step2*
// @match        https://thetvdb.com/series/*/seasons/official/*/bulkadd*
// @match        https://thetvdb.com/artwork/upload*
// @match        https://thetvdb.com/series/*/translate/eng*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      api.themoviedb.org
// @connect      www.omdbapi.com
// @connect      www.hoichoi.tv
// @connect      hoichoi.tv
// @connect      *.hoichoi.tv
// @connect      hoichoicdn.com
// @connect      *.hoichoicdn.com
// @connect      image.hoichoicdn.com
// @connect      hoichoi.dev
// @connect      *.hoichoi.dev
// @connect      sub.hoichoi.dev
// @connect      prod-content-api.hoichoi.dev
// @connect      libretranslate.com
// @connect      libretranslate.de
// @connect      api.mymemory.translated.net
// ==/UserScript==

(function() {
    'use strict';

    // Immediate console logs to verify script is running
    console.log('🎬 TVDB Workflow Helper v1.8.0 - Script file loaded');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Current pathname:', window.location.pathname);
    console.log('📋 Complete 5-step TVDB submission automation');
    console.log('⌨️  Keyboard shortcut: Ctrl+Shift+T (or Cmd+Shift+T on Mac) to show/hide');
    console.log('🔧 TMDB + OMDb + Hoichoi integration with flexible data source modes');
    console.log('🧪 Test function available: tvdbHelperTest() or tvdbHelperForceShow()');

    // Configuration and state
    const CONFIG = {
        tmdbApiKey: '',
        omdbApiKey: '',
        debugMode: false,
        showApiKeys: false,
        translationService: 'libretranslate', // 'libretranslate', 'mymemory', or 'none'
        enableTranslation: true
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
        'zh-CN': 'chi', // Simplified Chinese
        'zh-TW': 'chi', // Traditional Chinese
        'zh-HK': 'chi', // Hong Kong Chinese
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
        'te': 'tel',
        'ta': 'tam', // Tamil
        'ml': 'mal', // Malayalam
        'kn': 'kan', // Kannada
        'bn': 'ben', // Bengali
        'gu': 'guj', // Gujarati
        'pa': 'pan', // Punjabi
        'or': 'ori', // Odia
        'as': 'asm', // Assamese
        'ne': 'nep', // Nepali
        'si': 'sin', // Sinhala
        'my': 'mya', // Burmese
        'km': 'khm', // Khmer
        'lo': 'lao', // Lao
        'ka': 'kat', // Georgian
        'hy': 'hye', // Armenian
        'az': 'aze', // Azerbaijani
        'kk': 'kaz', // Kazakh
        'ky': 'kir', // Kyrgyz
        'uz': 'uzb', // Uzbek
        'tg': 'tgk', // Tajik
        'mn': 'mon', // Mongolian
        'bo': 'bod', // Tibetan
        'dz': 'dzo', // Dzongkha
        'he': 'heb', // Hebrew
        'fa': 'fas', // Persian
        'ur': 'urd', // Urdu
        'ps': 'pus', // Pashto
        'sd': 'snd', // Sindhi
        'bal': 'bal', // Balochi
        'brx': 'brx', // Bodo
        'gom': 'gom', // Konkani
        'mai': 'mai', // Maithili
        'mni': 'mni', // Manipuri
        'sat': 'sat', // Santali
        'kok': 'kok'  // Konkani
    };

    // Helper function to map TMDB language code to TVDB language code
    function mapLanguageCode(tmdbCode) {
        if (!tmdbCode) return 'en';
        
        log(`🔍 Mapping language code: ${tmdbCode}`);
        
        // Direct mapping
        if (LANGUAGE_MAP[tmdbCode]) {
            const result = LANGUAGE_MAP[tmdbCode];
            log(`✅ Direct mapping found: ${tmdbCode} -> ${result}`);
            return result;
        }
        
        // Try to find partial match (case insensitive)
        for (const [tmdb, tvdb] of Object.entries(LANGUAGE_MAP)) {
            if (tmdbCode.toLowerCase().includes(tmdb.toLowerCase()) || 
                tmdb.toLowerCase().includes(tmdbCode.toLowerCase())) {
                log(`✅ Partial mapping found: ${tmdbCode} -> ${tvdb} (via ${tmdb})`);
                return tvdb;
            }
        }
        
        // Special handling for Chinese variants
        if (tmdbCode.startsWith('zh')) {
            log(`✅ Chinese variant detected: ${tmdbCode} -> chi`);
            return 'chi';
        }
        
        log(`❌ No mapping found for: ${tmdbCode}, returning original`);
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
        'Action': 'Action',
        'Adventure': 'Adventure',
        'Animation': 'Animation',
        'Comedy': 'Comedy',
        'Romantic': 'Romance',
        'Romance': 'Romance',
        'Love': 'Romance',
        'Crime': 'Crime',
        'Documentary': 'Documentary',
        'Drama': 'Drama',
        'Family': 'Family',
        'Kids': 'Children',
        'Mystery': 'Mystery',
        'News': 'News',
        'Reality': 'Reality',
        'Sci-Fi & Fantasy': 'Science Fiction',
        'Science Fiction': 'Science Fiction',
        'Sci-Fi': 'Science Fiction',
        'Fantasy': 'Fantasy',
        'Soap': 'Soap',
        'Talk': 'Talk Show',
        'Thriller': 'Thriller',
        'Suspense': 'Thriller',
        'War & Politics': 'War',
        'War': 'War',
        'Western': 'Western',
        'Horror': 'Horror',
        'Musical': 'Musical',
        'Sport': 'Sport',
        'Sports': 'Sport',
        'Martial Arts': 'Action',
        'Food': 'Food',
        'History': 'History',
        'Awards Show': 'Awards Show'
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
            CONFIG.translationService = GM_getValue('tvdbwf_translation_service', 'libretranslate');
            CONFIG.enableTranslation = GM_getValue('tvdbwf_enable_translation', true);

            const savedContext = GM_getValue('tvdbwf_ctx', '{}');
            context = { ...context, ...JSON.parse(savedContext) };
        } catch (e) {
            log('Using default configuration');
        }
    }

    // Save configuration and context
    function saveConfig() {
        try {
            GM_setValue('tvdbwf_tmdb_key', CONFIG.tmdbApiKey);
            GM_setValue('tvdbwf_omdb_key', CONFIG.omdbApiKey);
            GM_setValue('tvdbwf_ui_showKeys', CONFIG.showApiKeys);
            GM_setValue('tvdbwf_ui_autoAdvance', CONFIG.autoAdvance);
            GM_setValue('tvdbwf_translation_service', CONFIG.translationService);
            GM_setValue('tvdbwf_enable_translation', CONFIG.enableTranslation);
            GM_setValue('tvdbwf_ctx', JSON.stringify(context));
        } catch (e) {
            log('Failed to save configuration:', e);
        }
    }

    // Logging function
    function log(message, data = null) {
        if (CONFIG.debugMode) {
            console.log(`[TVDB] ${message}`, data || '');
        }
    }

    // Global error handler for production
    function handleError(error, context = 'Unknown') {
        const errorMessage = `Error in ${context}: ${error.message}`;
        log(errorMessage, error);
        updateStatus(`Error: ${error.message}`);
        
        // Report critical errors to console even in production
        if (error.message.includes('API') || error.message.includes('Network')) {
            console.error(`[TVDB Critical] ${errorMessage}`);
        }
    }

    // Wait for page to load
    function waitForPage() {
        try {
            // Check if body exists and page is ready
            if (document.readyState === 'complete' && document.body) {
                // Small delay to ensure DOM is fully ready
                setTimeout(() => {
            init();
                }, 100);
        } else {
            setTimeout(waitForPage, 100);
            }
        } catch (error) {
            console.error('❌ Error in waitForPage:', error);
            // Retry after a delay
            setTimeout(waitForPage, 500);
        }
    }

    // Initialize the script
    function init() {
        try {
        log('Initializing TVDB Workflow Helper - Complete');
            log('Current URL:', window.location.href);
            log('Current path:', window.location.pathname);
            log('Document ready state:', document.readyState);
            
        loadConfig();
        
            // Setup keyboard shortcut first
            setupKeyboardShortcut();
            
            // Create floating toggle button
            createFloatingToggle();
            
            // Create main UI
        createUI();
        
            log('✅ Initialization complete');
        } catch (error) {
            console.error('❌ Error initializing TVDB Workflow Helper:', error);
            console.error('Error stack:', error.stack);
            // Try to show a basic error message
            try {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:red;color:white;padding:10px;z-index:99999;border-radius:4px;';
                errorDiv.innerHTML = '<strong>TVDB Helper Error:</strong><br>' + error.message + '<br><small>Check console for details</small>';
                document.body.appendChild(errorDiv);
            } catch (e) {
                // If we can't even show an error, just log it
                console.error('Failed to show error UI:', e);
            }
        }
    }


    // Toggle panel visibility
    function togglePanel() {
        const panel = document.getElementById('tvdb-helper-ui');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        } else {
            // If panel doesn't exist, create it
            log('Panel not found, creating UI...');
            createUI();
        }
    }

    // Force show panel (creates if doesn't exist)
    function forceShowPanel() {
        const panel = document.getElementById('tvdb-helper-ui');
        if (panel) {
            panel.style.display = 'block';
            log('Panel forced to show');
        } else {
            log('Panel not found, creating UI...');
            createUI();
        }
    }

    // Create floating toggle button
    function createFloatingToggle() {
        try {
            // Remove existing toggle if any
            const existingToggle = document.getElementById('tvdb-helper-toggle');
            if (existingToggle) {
                existingToggle.remove();
            }

            if (!document.body) {
                setTimeout(createFloatingToggle, 100);
                return;
            }

            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'tvdb-helper-toggle';
            toggleBtn.textContent = '🎬';
            toggleBtn.title = 'TVDB Helper (Ctrl+Shift+T)';
            toggleBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background: #2d5aa0; color: white; border: 2px solid #1a3d6b; border-radius: 50%; cursor: pointer; font-size: 24px; z-index: 99998; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;';
            
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    if (typeof forceShowPanel === 'function') {
                        forceShowPanel();
                    } else {
                        init();
                    }
                } catch (err) {
                    console.error('Error in toggle button click:', err);
                }
            });

            toggleBtn.addEventListener('mouseenter', function() {
                this.style.background = '#3d6ab0';
                this.style.transform = 'scale(1.1)';
            });

            toggleBtn.addEventListener('mouseleave', function() {
                this.style.background = '#2d5aa0';
                this.style.transform = 'scale(1)';
            });

            document.body.appendChild(toggleBtn);
            log('Floating toggle button created');
        } catch (error) {
            console.error('Error creating floating toggle:', error);
        }
    }

    // Setup keyboard shortcut (Ctrl+Shift+T)
    function setupKeyboardShortcut() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+Shift+T (or Cmd+Shift+T on Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                e.stopPropagation();
                log('Keyboard shortcut triggered (Ctrl+Shift+T)');
                forceShowPanel();
            }
        });
        log('Keyboard shortcut registered: Ctrl+Shift+T (or Cmd+Shift+T on Mac)');
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
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; width: 320px; max-height: 85vh; background: #1a1a1a; color: #e0e0e0; border: 1px solid #333; border-radius: 6px; padding: 12px; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.4); scrollbar-width: thin; scrollbar-color: #555 #333;';
        
        // Add webkit scrollbar styles
        const style = document.createElement('style');
        style.textContent = '#tvdb-helper-ui::-webkit-scrollbar { width: 8px; } #tvdb-helper-ui::-webkit-scrollbar-track { background: #333; border-radius: 4px; } #tvdb-helper-ui::-webkit-scrollbar-thumb { background: #4CAF50; border-radius: 4px; } #tvdb-helper-ui::-webkit-scrollbar-thumb:hover { background: #45a049; }';
        
        try {
            document.head.appendChild(style);
        } catch (e) {
            console.error('Could not append style:', e);
        }

        try {
            container.innerHTML = generateUIHTML(currentStep);
        } catch (error) {
            console.error('Error generating UI HTML:', error);
            container.innerHTML = '<div style="padding: 20px; color: red;">Error generating UI. Check console for details.</div>';
        }
        
        // Ensure body exists before appending
        if (!document.body) {
            log('⚠️ document.body not ready, waiting...');
            setTimeout(function() {
                if (document.body) {
                    try {
                        document.body.appendChild(container);
                        setupEventListeners();
                        log('UI created successfully for step:', currentStep);
                    } catch (e) {
                        console.error('Error appending UI:', e);
                    }
                } else {
                    log('❌ document.body still not available');
                }
            }, 200);
        } else {
            try {
        document.body.appendChild(container);
        setupEventListeners();
        log('UI created successfully for step:', currentStep);
            } catch (error) {
                console.error('Error appending UI to body:', error);
                log('❌ Failed to append UI to body: ' + error.message);
            }
        }
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
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #555;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 12px; font-weight: 600;">Translation Settings:</label>
                    <div style="margin-bottom: 10px;">
                        <label style="display: flex; align-items: center; color: #ccc; font-size: 11px; cursor: pointer;">
                            <input type="checkbox" id="tvdb-enable-translation" ${CONFIG.enableTranslation ? 'checked' : ''} 
                                   style="margin-right: 6px; cursor: pointer;">
                            Enable automatic translation to original language
                        </label>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 12px;">Translation Service:</label>
                        <select id="tvdb-translation-service" 
                                style="width: 100%; padding: 6px; border: 1px solid #555; border-radius: 4px; background: #222; color: white; font-size: 12px;">
                            <option value="libretranslate" ${CONFIG.translationService === 'libretranslate' ? 'selected' : ''}>LibreTranslate (Free)</option>
                            <option value="mymemory" ${CONFIG.translationService === 'mymemory' ? 'selected' : ''}>MyMemory (Free)</option>
                            <option value="none" ${CONFIG.translationService === 'none' ? 'selected' : ''}>Disabled</option>
                        </select>
                    </div>
                    <div style="padding: 8px; background: #2a2a2a; border-radius: 3px; font-size: 10px; color: #aaa; margin-top: 8px;">
                        <strong>Note:</strong> Translates English titles/overviews to original language when TMDB data is missing original language content.
                    </div>
                </div>
                <button id="tvdb-save-config" style="width: 100%; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 8px; cursor: pointer; font-size: 12px; margin-top: 10px;">Save Configuration</button>
            </div>
        ` : `
            <div style="margin-bottom: 10px; padding: 8px; background: #2a2a2a; border-radius: 4px; border-left: 3px solid #4CAF50;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #4CAF50; font-weight: 600; font-size: 12px;">API Configuration</span>
                    <button id="tvdb-show-keys" style="background: #555; color: white; border: none; border-radius: 3px; padding: 3px 6px; cursor: pointer; font-size: 10px;">Manage</button>
                </div>
                <div style="color: #ccc; font-size: 11px; margin-top: 4px;">
                    ${CONFIG.tmdbApiKey ? '✓ TMDB' : '✗ TMDB'} | 
                    ${CONFIG.omdbApiKey ? '✓ OMDb' : '✗ OMDb'}
                </div>
            </div>
        `;

        const stepContent = generateStepContent(step);

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <h3 style="margin: 0; color: #4CAF50; font-size: 16px; font-weight: 600;">TVDB Workflow Helper</h3>
                <div style="display: flex; gap: 4px;">
                    <button id="tvdb-minimize-btn" style="background: #666; color: white; border: none; border-radius: 3px; padding: 4px 6px; cursor: pointer; font-size: 11px; line-height: 1;">−</button>
                    <button id="tvdb-close-btn" style="background: #f44336; color: white; border: none; border-radius: 3px; padding: 4px 6px; cursor: pointer; font-size: 11px; line-height: 1;">×</button>
                </div>
            </div>

            <div style="margin-bottom: 12px; padding: 6px 10px; background: #333; border-radius: 4px; text-align: center;">
                <span style="color: #FF9800; font-size: 13px; font-weight: 500;">Step ${step.replace('step', '')}: ${getStepName(step)}</span>
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
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Data Source:</label>
                        <select id="tvdb-data-source" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;">
                            <option value="tmdb">TMDB (Recommended)</option>
                            <option value="omdb">OMDb Only (IMDb ID)</option>
                            <option value="hoichoi">Hoichoi (URL)</option>
                        </select>
                    </div>

                    <div id="tvdb-tmdb-fields" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId}">
                    </div>

                    <div id="tvdb-omdb-fields" style="margin-bottom: 15px; display: none;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">IMDb ID:</label>
                        <input type="text" id="tvdb-imdb-id-only" placeholder="e.g., tt1234567"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 5px;"
                               value="${context.imdbId}">
                        <div style="font-size: 10px; color: #999; margin-bottom: 10px;">
                            ⚠️ OMDb-only mode: Limited data available, no episode descriptions
                        </div>
                    </div>

                    <div id="tvdb-hoichoi-fields" style="margin-bottom: 15px; display: none;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Hoichoi Show URL:</label>
                        <input type="text" id="tvdb-hoichoi-url" placeholder="e.g., https://www.hoichoi.tv/shows/show-slug or /webseries/show-slug"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 5px;"
                               value="">
                        <div style="font-size: 10px; color: #999; margin-bottom: 10px;">
                            ⚠️ Hoichoi mode: Official site will be set to this URL
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-fetch-data" class="tvdb-workflow-btn" style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fetch Data</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="flex: 1; background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fill</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-apply-continue-step1" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply ▶</button>
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
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Data Source:</label>
                        <select id="tvdb-data-source-step2" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;">
                            <option value="tmdb">TMDB (Recommended)</option>
                            <option value="omdb">OMDb Only (IMDb ID)</option>
                            <option value="hoichoi">Hoichoi (URL)</option>
                        </select>
                    </div>

                    <div id="tvdb-tmdb-fields-step2" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id-step2" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId}">
                    </div>

                    <div id="tvdb-omdb-fields-step2" style="margin-bottom: 15px; display: none;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">IMDb ID:</label>
                        <input type="text" id="tvdb-imdb-id-step2-only" placeholder="e.g., tt1234567"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 5px;"
                               value="${context.imdbId}">
                        <div style="font-size: 10px; color: #999; margin-bottom: 10px;">
                            ⚠️ OMDb-only mode: Limited data available
                        </div>
                    </div>

                    <div id="tvdb-hoichoi-fields-step2" style="margin-bottom: 15px; display: none;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Hoichoi Show URL:</label>
                        <input type="text" id="tvdb-hoichoi-url-step2" placeholder="e.g., https://www.hoichoi.tv/shows/show-slug or /webseries/show-slug"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 5px;"
                               value="">
                        <div style="font-size: 10px; color: #999; margin-bottom: 10px;">
                            ⚠️ Hoichoi mode: Official site will be set to this URL
                        </div>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; color: #ccc; font-size: 11px; font-weight: 500;">Series Data</label>
                        <div style="background: #2a2a2a; padding: 6px 8px; border-radius: 3px; font-size: 11px; color: #ccc; border-left: 3px solid #FF9800;">
                            ${context.tmdbId ? `TMDB ID: ${context.tmdbId}` : 'No TMDB ID available'}
                            ${context.imdbId ? `<br>IMDb ID: ${context.imdbId}` : ''}
                            ${context.originalIso1 ? `<br>Language: ${context.originalIso1}` : ''}
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                        <button id="tvdb-fetch-data-step2" class="tvdb-workflow-btn" style="background: #FF9800; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: 500;">Fetch Data</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: 500;">Fill Form</button>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                        <button id="tvdb-apply-continue-step2" class="tvdb-workflow-btn" style="background: #2196F3; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: 500;">Apply ▶</button>
                        <button id="tvdb-skip-step" style="background: #666; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: 500;">Skip Step</button>
                    </div>
                    
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #444;">
                        <div style="margin-bottom: 8px; color: #ccc; font-size: 11px; font-weight: 600;">Manual Translation:</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <button id="tvdb-translate-title" class="tvdb-workflow-btn" style="background: #9C27B0; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 12px;">🌐 Translate Title</button>
                            <button id="tvdb-translate-overview" class="tvdb-workflow-btn" style="background: #9C27B0; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 12px;">🌐 Translate Overview</button>
                        </div>
                        <div style="margin-top: 6px; padding: 6px; background: #2a2a2a; border-radius: 3px; font-size: 10px; color: #aaa;">
                            Translate English title/overview to original language (${context.originalIso1 || 'auto-detect'})
                        </div>
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
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Episode Data Source:</label>
                        <select id="tvdb-episode-source" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;">
                            <option value="tmdb">TMDB (Recommended)</option>
                            <option value="omdb">OMDb Only (IMDb ID)</option>
                            <option value="manual">Manual Input (Paste Data)</option>
                        </select>
                    </div>

                    <div id="tvdb-tmdb-episode-fields">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">TMDB TV ID:</label>
                        <input type="text" id="tvdb-tmdb-id-step3" placeholder="e.g., 277489"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 10px;"
                               value="${context.tmdbId}">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #ccc;">IMDb ID (optional, for description fallback):</label>
                            <input type="text" id="tvdb-imdb-id-step3" placeholder="e.g., tt1234567" value="${context.imdbId || ''}" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: #fff; font-size: 12px;">
                        </div>
                    </div>

                    <div id="tvdb-omdb-episode-fields" style="display: none;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #ccc;">IMDb ID:</label>
                            <input type="text" id="tvdb-imdb-id-step3-only" placeholder="e.g., tt1234567"
                                   style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 5px;"
                                   value="${context.imdbId}">
                            <div style="font-size: 10px; color: #999; margin-bottom: 10px;">
                                ⚠️ OMDb episode data: titles and air dates only, limited descriptions
                            </div>
                        </div>
                    </div>

                    <div id="tvdb-manual-episode-fields" style="display: none;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #ccc;">Paste Episode Data (JSON or Text):</label>
                            <textarea id="tvdb-manual-episode-data" placeholder='Paste episode data here. Examples:

CSV format (from Gemini/AI):
Episode Number,Title (Original),Runtime,Summary/Description
S1 E1,Kiraaye Ka Kissa - Hindi,9m,Shreya is muddled about...
S1 E2,Online Shaadi - Hindi,9m,When her parents...

JSON format:
[
  {"episodeNumber": 1, "name": "Kiraaye Ka Kissa - Hindi", "overview": "Shreya is muddled...", "runtime": 9}
]

Or simple text format:
1. Kiraaye Ka Kissa - Hindi | 9m | Shreya is muddled...'
                                   style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; min-height: 150px; font-family: monospace; font-size: 11px; margin-bottom: 5px;"></textarea>
                            <div style="font-size: 10px; color: #999; margin-bottom: 10px;">
                                💡 Tip: Take a screenshot of Hoichoi episodes, extract data with Gemini/AI, and paste here
                            </div>
                        </div>
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

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-fetch-episodes" class="tvdb-workflow-btn" style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fetch Episodes</button>
                        <button id="tvdb-apply" class="tvdb-workflow-btn" style="flex: 1; background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Fill</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <button id="tvdb-apply-continue-step3" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply ▶</button>
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
                        <button id="tvdb-apply-continue-step4" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply ▶</button>
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
                        <div id="tvdb-translation-data" style="background: #222; padding: 8px; border-radius: 4px; font-size: 12px; color: #ccc;">
                            ${(() => {
                                // Check if Hoichoi data is available
                                const hasHoichoiData = window.tvdbFetchedData && window.tvdbFetchedData.tmdb && window.tvdbFetchedData.tmdb.isHoichoiOnly;
                                const hoichoiUrl = window.tvdbFetchedData?.officialSite || '';
                                
                                if (hasHoichoiData && hoichoiUrl) {
                                    return `Hoichoi URL: <a href="${hoichoiUrl}" target="_blank" style="color: #9C27B0;">${hoichoiUrl}</a><br>Source: Hoichoi (${context.originalIso1 || 'hi'})<br>Translating from ${context.originalIso1 || 'hi'} to English`;
                                } else {
                                    let html = context.tmdbId ? `TMDB ID: ${context.tmdbId}` : 'No TMDB ID available';
                                    if (context.imdbId) html += `<br>IMDb ID: ${context.imdbId}`;
                                    if (context.originalIso1 !== 'en') {
                                        html += `<br>Translating from ${context.originalIso1} to English`;
                                    } else {
                                        html += '<br>No translation needed (already English)';
                                    }
                                    return html;
                                }
                            })()}
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Translation Source:</label>
                        <select id="tvdb-translation-source" style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: #fff; font-size: 12px;">
                            <option value="tmdb">TMDB (Recommended)</option>
                            <option value="omdb">OMDb</option>
                            <option value="hoichoi">Hoichoi (URL)</option>
                            <option value="manual">Manual Entry</option>
                        </select>
                    </div>

                    <div id="tvdb-hoichoi-url-fields-step5" style="margin-bottom: 15px; display: none;">
                        <label style="display: block; margin-bottom: 5px; color: #ccc;">Hoichoi Show URL:</label>
                        <input type="text" id="tvdb-hoichoi-url-step5" placeholder="e.g., https://www.hoichoi.tv/shows/show-slug or /webseries/show-slug"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white; margin-bottom: 5px;"
                               value="${window.tvdbFetchedData?.officialSite || ''}">
                        <div style="font-size: 10px; color: #999; margin-bottom: 10px;">
                            ⚠️ Hoichoi shows are in regional languages. For English translations, use TMDB or OMDb.
                        </div>
                    </div>

                    <div id="tvdb-hoichoi-translation-note" style="margin-bottom: 15px; display: none;">
                        <div style="background: #2a3a4a; padding: 8px; border-radius: 4px; border-left: 3px solid #9C27B0; font-size: 11px; color: #ccc;">
                            <div style="color: #9C27B0; font-weight: bold; margin-bottom: 4px;">📺 Hoichoi Translation Note</div>
                            <div>Hoichoi shows are typically in regional languages. English translations should be fetched from TMDB or OMDb. This will fetch the show data from Hoichoi URL.</div>
                        </div>
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
                        <button id="tvdb-apply-continue-step5" class="tvdb-workflow-btn" style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer;">Apply ▶</button>
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
                
                // Data source selector
                const dataSourceSelect = document.getElementById('tvdb-data-source');
                if (dataSourceSelect) {
                    dataSourceSelect.onchange = function() {
                        const tmdbFields = document.getElementById('tvdb-tmdb-fields');
                        const omdbFields = document.getElementById('tvdb-omdb-fields');
                        const hoichoiFields = document.getElementById('tvdb-hoichoi-fields');
                        
                        if (this.value === 'omdb') {
                            if (tmdbFields) tmdbFields.style.display = 'none';
                            if (omdbFields) omdbFields.style.display = 'block';
                            if (hoichoiFields) hoichoiFields.style.display = 'none';
                        } else if (this.value === 'hoichoi') {
                            if (tmdbFields) tmdbFields.style.display = 'none';
                            if (omdbFields) omdbFields.style.display = 'none';
                            if (hoichoiFields) hoichoiFields.style.display = 'block';
                        } else {
                            if (tmdbFields) tmdbFields.style.display = 'block';
                            if (omdbFields) omdbFields.style.display = 'none';
                            if (hoichoiFields) hoichoiFields.style.display = 'none';
                        }
                    };
                }
                break;
            case 'step2':
                const fetchDataStep2Btn = document.getElementById('tvdb-fetch-data-step2');
                if (fetchDataStep2Btn) fetchDataStep2Btn.onclick = fetchDataStep2;
                
                const translateTitleBtn = document.getElementById('tvdb-translate-title');
                if (translateTitleBtn) translateTitleBtn.onclick = translateTitle;
                
                const translateOverviewBtn = document.getElementById('tvdb-translate-overview');
                if (translateOverviewBtn) translateOverviewBtn.onclick = translateOverview;
                
                // Data source selector for Step 2
                const dataSourceSelectStep2 = document.getElementById('tvdb-data-source-step2');
                if (dataSourceSelectStep2) {
                    dataSourceSelectStep2.onchange = function() {
                        const tmdbFieldsStep2 = document.getElementById('tvdb-tmdb-fields-step2');
                        const omdbFieldsStep2 = document.getElementById('tvdb-omdb-fields-step2');
                        const hoichoiFieldsStep2 = document.getElementById('tvdb-hoichoi-fields-step2');
                        if (this.value === 'omdb') {
                            if (tmdbFieldsStep2) tmdbFieldsStep2.style.display = 'none';
                            if (omdbFieldsStep2) omdbFieldsStep2.style.display = 'block';
                            if (hoichoiFieldsStep2) hoichoiFieldsStep2.style.display = 'none';
                        } else if (this.value === 'hoichoi') {
                            if (tmdbFieldsStep2) tmdbFieldsStep2.style.display = 'none';
                            if (omdbFieldsStep2) omdbFieldsStep2.style.display = 'none';
                            if (hoichoiFieldsStep2) hoichoiFieldsStep2.style.display = 'block';
                        } else {
                            if (tmdbFieldsStep2) tmdbFieldsStep2.style.display = 'block';
                            if (omdbFieldsStep2) omdbFieldsStep2.style.display = 'none';
                            if (hoichoiFieldsStep2) hoichoiFieldsStep2.style.display = 'none';
                        }
                    };
                }
                break;
            case 'step3':
                const fetchEpisodesBtn = document.getElementById('tvdb-fetch-episodes');
                if (fetchEpisodesBtn) fetchEpisodesBtn.onclick = fetchEpisodes;
                
                // Episode source selector
                const episodeSourceSelect = document.getElementById('tvdb-episode-source');
                if (episodeSourceSelect) {
                    episodeSourceSelect.onchange = function() {
                        const tmdbEpisodeFields = document.getElementById('tvdb-tmdb-episode-fields');
                        const omdbEpisodeFields = document.getElementById('tvdb-omdb-episode-fields');
                        const manualEpisodeFields = document.getElementById('tvdb-manual-episode-fields');
                        if (this.value === 'omdb') {
                            if (tmdbEpisodeFields) tmdbEpisodeFields.style.display = 'none';
                            if (omdbEpisodeFields) omdbEpisodeFields.style.display = 'block';
                            if (manualEpisodeFields) manualEpisodeFields.style.display = 'none';
                        } else if (this.value === 'manual') {
                            if (tmdbEpisodeFields) tmdbEpisodeFields.style.display = 'none';
                            if (omdbEpisodeFields) omdbEpisodeFields.style.display = 'none';
                            if (manualEpisodeFields) manualEpisodeFields.style.display = 'block';
                        } else {
                            if (tmdbEpisodeFields) tmdbEpisodeFields.style.display = 'block';
                            if (omdbEpisodeFields) omdbEpisodeFields.style.display = 'none';
                            if (manualEpisodeFields) manualEpisodeFields.style.display = 'none';
                        }
                    };
                }
                break;
            case 'step4':
                const fetchPostersBtn = document.getElementById('tvdb-fetch-posters');
                if (fetchPostersBtn) fetchPostersBtn.onclick = fetchPosters;
                break;
            case 'step5':
                const fetchTranslationBtn = document.getElementById('tvdb-fetch-translation');
                if (fetchTranslationBtn) fetchTranslationBtn.onclick = fetchTranslation;
                
                // Translation source selector for Step 5
                const translationSourceSelect = document.getElementById('tvdb-translation-source');
                if (translationSourceSelect) {
                    translationSourceSelect.onchange = function() {
                        const hoichoiNote = document.getElementById('tvdb-hoichoi-translation-note');
                        const hoichoiFields = document.getElementById('tvdb-hoichoi-url-fields-step5');
                        if (hoichoiNote) {
                            hoichoiNote.style.display = this.value === 'hoichoi' ? 'block' : 'none';
                        }
                        if (hoichoiFields) {
                            hoichoiFields.style.display = this.value === 'hoichoi' ? 'block' : 'none';
                        }
                        // Update translation data display when source changes
                        updateTranslationData();
                    };
                    // Update translation data on initial load
                    setTimeout(updateTranslationData, 100);
                    // Show Hoichoi fields if Hoichoi is already selected
                    if (translationSourceSelect.value === 'hoichoi') {
                        const hoichoiFields = document.getElementById('tvdb-hoichoi-url-fields-step5');
                        const hoichoiNote = document.getElementById('tvdb-hoichoi-translation-note');
                        if (hoichoiFields) hoichoiFields.style.display = 'block';
                        if (hoichoiNote) hoichoiNote.style.display = 'block';
                    }
                }
                break;
        }
    }

    // Save configuration
    function saveConfiguration() {
        CONFIG.tmdbApiKey = document.getElementById('tvdb-tmdb-key').value;
        CONFIG.omdbApiKey = document.getElementById('tvdb-omdb-key').value;
        
        // Get translation settings
        const enableTranslationCheckbox = document.getElementById('tvdb-enable-translation');
        if (enableTranslationCheckbox) {
            CONFIG.enableTranslation = enableTranslationCheckbox.checked;
        }
        
        const translationServiceSelect = document.getElementById('tvdb-translation-service');
        if (translationServiceSelect) {
            CONFIG.translationService = translationServiceSelect.value;
        }

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

    // Update translation data display (for Step 5)
    function updateTranslationData() {
        const translationDataDiv = document.getElementById('tvdb-translation-data');
        if (!translationDataDiv) return;

        // Check if Hoichoi data is available
        const hasHoichoiData = window.tvdbFetchedData && window.tvdbFetchedData.tmdb && window.tvdbFetchedData.tmdb.isHoichoiOnly;
        const hoichoiUrl = window.tvdbFetchedData?.officialSite || '';
        
        if (hasHoichoiData && hoichoiUrl) {
            translationDataDiv.innerHTML = `Hoichoi URL: <a href="${hoichoiUrl}" target="_blank" style="color: #9C27B0;">${hoichoiUrl}</a><br>Source: Hoichoi (${context.originalIso1 || 'hi'})<br>Translating from ${context.originalIso1 || 'hi'} to English`;
        } else {
            let html = context.tmdbId ? `TMDB ID: ${context.tmdbId}` : 'No TMDB ID available';
            if (context.imdbId) html += `<br>IMDb ID: ${context.imdbId}`;
            if (context.originalIso1 && context.originalIso1 !== 'en') {
                html += `<br>Translating from ${context.originalIso1} to English`;
            } else if (!context.originalIso1 || context.originalIso1 === 'en') {
                html += '<br>No translation needed (already English)';
            }
            translationDataDiv.innerHTML = html;
        }
    }

    // Fetch data for step 2
    async function fetchDataStep2() {
        const dataSource = document.getElementById('tvdb-data-source-step2')?.value || 'tmdb';
        
        // Check which mode we're in
        if (dataSource === 'omdb') {
            // OMDb-only mode
            await fetchDataStep2OmdbOnly();
        } else if (dataSource === 'hoichoi') {
            // Hoichoi mode
            await fetchDataStep2Hoichoi();
        } else {
            // TMDB mode (original behavior)
            await fetchDataStep2Tmdb();
        }
    }

    // Fetch data for step 2 using TMDB (original behavior)
    async function fetchDataStep2Tmdb() {
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

            // Get translated title and overview if needed
            if (CONFIG.enableTranslation && tmdbData.originalLanguage && tmdbData.originalLanguage !== 'en') {
                updateStatus('Checking translations...');
                try {
                    const translated = await getTranslatedTitleAndOverview(tmdbData);
                    // Update tmdbData with translated values
                    if (translated.originalName) {
                        tmdbData.originalName = translated.originalName;
                        log(`Using translated title: ${translated.originalName.substring(0, 50)}...`);
                    }
                    if (translated.overview) {
                        tmdbData.overview = translated.overview;
                        log(`Using translated overview: ${translated.overview.substring(0, 50)}...`);
                    }
                } catch (error) {
                    log(`Translation check failed: ${error.message}`);
                    // Continue with original data if translation fails
                }
            }

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

    // Fetch data for step 2 using OMDb only (no TMDB)
    async function fetchDataStep2OmdbOnly() {
        const imdbId = document.getElementById('tvdb-imdb-id-step2-only').value.trim();

        if (!imdbId) {
            updateStatus('Please enter an IMDb ID');
            return;
        }

        if (!CONFIG.omdbApiKey) {
            updateStatus('Please configure OMDb API key first');
            return;
        }

        // Validate IMDb ID format
        if (!imdbId.match(/^tt\d+$/)) {
            updateStatus('Invalid IMDb ID format. Should be like: tt1234567');
            return;
        }

        updateStatus('Fetching data from OMDb...');
        log('Starting OMDb-only fetch for IMDb ID:', imdbId);

        try {
            // Fetch full OMDb data
            const omdbFullData = await fetchOmdbDataFull(imdbId);
            log('OMDb full data received:', omdbFullData);

            // Convert to TMDB-compatible format
            const tmdbData = convertOmdbToTmdbFormat(omdbFullData);
            log('Converted to TMDB format:', tmdbData);

            // Create simplified OMDb data for compatibility
            const omdbData = {
                title: omdbFullData.Title,
                year: omdbFullData.Year,
                language: omdbFullData.Language,
                imdbId: omdbFullData.imdbID
            };

            // Update context
            context.tmdbId = ''; // No TMDB ID in OMDb-only mode
            context.imdbId = imdbId;
            context.originalIso1 = tmdbData.originalLanguage;

            // Store fetched data
            window.tvdbFetchedData = {
                tmdb: tmdbData,
                omdb: omdbData,
                imdbId: imdbId,
                isOmdbOnly: true
            };

            // Generate preview
            const preview = generateStep2Preview(tmdbData, omdbData);
            updatePreview(preview);

            // Update status
            updateStatus(`OMDb data fetched successfully! IMDb ID: ${imdbId}`);

            log('OMDb-only fetch completed', window.tvdbFetchedData);

        } catch (error) {
            updateStatus(`Error fetching OMDb data: ${error.message}`);
            log('Error fetching OMDb data:', error);
        }
    }

    // Fetch data for step 2 using Hoichoi (HTML scraping)
    async function fetchDataStep2Hoichoi() {
        const hoichoiUrl = document.getElementById('tvdb-hoichoi-url-step2').value.trim();

        if (!hoichoiUrl) {
            updateStatus('Please enter a Hoichoi show URL');
            return;
        }

        // Validate URL format using flexible validation
        if (!isValidHoichoiUrl(hoichoiUrl)) {
            updateStatus(getHoichoiUrlErrorMessage());
            return;
        }

        updateStatus('Fetching data from Hoichoi...');
        log('Starting Hoichoi fetch for Step 2, URL:', hoichoiUrl);

        try {
            // Fetch and scrape Hoichoi show
            const tvdbData = await fetchHoichoiShow(hoichoiUrl);

            // Create simplified data for compatibility
            const omdbData = null; // No OMDb data for Hoichoi

            // Update context
            context.tmdbId = ''; // No TMDB ID in Hoichoi mode
            context.imdbId = null; // No IMDb ID
            context.originalIso1 = tvdbData.originalLanguage;

            // Store fetched data
            window.tvdbFetchedData = {
                tmdb: tvdbData,
                omdb: omdbData,
                imdbId: null,
                tmdbId: '', // No TMDB ID
                officialSite: hoichoiUrl, // Use Hoichoi URL as official site
                isHoichoiOnly: true
            };

            // Generate preview
            const preview = generateStep2Preview(tvdbData, omdbData);
            updatePreview(preview);

            // Update status
            updateStatus(`Hoichoi data fetched successfully! Official site set to: ${hoichoiUrl}`);

            log('Hoichoi fetch completed for Step 2', window.tvdbFetchedData);

        } catch (error) {
            const errorMsg = error.message || error.toString() || 'Unknown error';
            log('Error fetching Hoichoi data for Step 2:', error);
            log('Error stack:', error.stack);
            log('Error details:', JSON.stringify(error));
            
            // Provide more helpful error message
            let userFriendlyMsg = `Error fetching Hoichoi data: ${errorMsg}`;
            if (errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS')) {
                userFriendlyMsg += '\n\nPossible solutions:\n1. Check Tampermonkey permissions for hoichoi.tv\n2. Make sure @connect www.hoichoi.tv is in script header\n3. Try refreshing the page';
            }
            
            updateStatus(userFriendlyMsg);
        }
    }

    // Manual translation functions for Step 2
    async function translateTitle() {
        if (!window.tvdbFetchedData || !window.tvdbFetchedData.tmdb) {
            updateStatus('No data available. Please fetch data first.');
            return;
        }
        
        const tmdbData = window.tvdbFetchedData.tmdb;
        const originalLang = tmdbData.originalLanguage || context.originalIso1;
        
        if (!originalLang || originalLang === 'en') {
            updateStatus('Original language is English. No translation needed.');
            return;
        }
        
        const currentTitle = tmdbData.originalName || tmdbData.name;
        if (!currentTitle || !currentTitle.trim()) {
            updateStatus('No title available to translate.');
            return;
        }
        
        if (!CONFIG.enableTranslation || CONFIG.translationService === 'none') {
            updateStatus('⚠ Translation is disabled. Please enable it in settings (Manage Keys > Translation Settings).');
            return;
        }
        
        try {
            updateStatus(`Translating title to ${originalLang}...`);
            log(`Manually translating title: "${currentTitle}" to ${originalLang}`);
            
            const translated = await translateText(currentTitle, originalLang);
            
            if (translated && translated !== currentTitle && translated.trim().length > 0) {
                // Update the data
                tmdbData.originalName = translated;
                window.tvdbFetchedData.tmdb = tmdbData;
                
                // Update preview
                const preview = generateStep2Preview(tmdbData, window.tvdbFetchedData.omdb);
                updatePreview(preview);
                
                updateStatus(`✓ Title translated successfully!`);
                log(`✓ Translated title: "${currentTitle}" -> "${translated}"`);
            } else {
                updateStatus(`Translation didn't change the text. Using original.`);
            }
        } catch (error) {
            updateStatus(`Translation failed: ${error.message}`);
            log(`Translation error:`, error);
        }
    }
    
    async function translateOverview() {
        if (!window.tvdbFetchedData || !window.tvdbFetchedData.tmdb) {
            updateStatus('No data available. Please fetch data first.');
            return;
        }
        
        const tmdbData = window.tvdbFetchedData.tmdb;
        const originalLang = tmdbData.originalLanguage || context.originalIso1;
        
        if (!originalLang || originalLang === 'en') {
            updateStatus('Original language is English. No translation needed.');
            return;
        }
        
        const currentOverview = tmdbData.overview;
        if (!currentOverview || !currentOverview.trim()) {
            updateStatus('No overview available to translate.');
            return;
        }
        
        if (!CONFIG.enableTranslation || CONFIG.translationService === 'none') {
            updateStatus('⚠ Translation is disabled. Please enable it in settings (Manage Keys > Translation Settings).');
            return;
        }
        
        try {
            updateStatus(`Translating overview to ${originalLang}...`);
            log(`Manually translating overview (${currentOverview.length} chars) to ${originalLang}`);
            
            const translated = await translateText(currentOverview, originalLang);
            
            if (translated && translated !== currentOverview && translated.trim().length > 0) {
                // Update the data
                tmdbData.overview = translated;
                window.tvdbFetchedData.tmdb = tmdbData;
                
                // Update preview
                const preview = generateStep2Preview(tmdbData, window.tvdbFetchedData.omdb);
                updatePreview(preview);
                
                updateStatus(`✓ Overview translated successfully!`);
                log(`✓ Translated overview: "${currentOverview.substring(0, 50)}..." -> "${translated.substring(0, 50)}..."`);
            } else {
                updateStatus(`Translation didn't change the text. Using original.`);
            }
        } catch (error) {
            updateStatus(`Translation failed: ${error.message}`);
            log(`Translation error:`, error);
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
        const episodeSource = document.getElementById('tvdb-episode-source')?.value || 'tmdb';
        
        // Check which mode we're in
        if (episodeSource === 'omdb') {
            // OMDb-only mode
            await fetchEpisodesOmdbOnly();
        } else if (episodeSource === 'manual') {
            // Manual input mode
            await fetchEpisodesManual();
        } else {
            // TMDB mode (original behavior)
            await fetchEpisodesTmdb();
        }
    }

    // Fetch episodes using TMDB (original behavior)
    async function fetchEpisodesTmdb() {
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

            // Sort episodes by episode number to ensure correct order
            episodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
            
            // Sort episodes by episode number to ensure correct order
            episodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
            log(`✅ Sorted ${episodes.length} episodes by episode number`);

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

    // Fetch episodes using OMDb only (no TMDB)
    async function fetchEpisodesOmdbOnly() {
        const seasonNum = document.getElementById('tvdb-season-num').value.trim();
        const imdbId = document.getElementById('tvdb-imdb-id-step3-only').value.trim();

        if (!seasonNum) {
            updateStatus('Please enter a season number');
            return;
        }

        if (!imdbId) {
            updateStatus('Please enter an IMDb ID');
            return;
        }

        if (!CONFIG.omdbApiKey) {
            updateStatus('Please configure OMDb API key first');
            return;
        }

        // Validate IMDb ID format
        if (!imdbId.match(/^tt\d+$/)) {
            updateStatus('Invalid IMDb ID format. Should be like: tt1234567');
            return;
        }

        updateStatus(`Fetching episodes from OMDb for Season ${seasonNum}...`);
        log(`Starting OMDb-only episode fetch for IMDb ID: ${imdbId}, Season: ${seasonNum}`);

        try {
            // Fetch episodes from OMDb
            const omdbEpisodes = await fetchOmdbSeason(imdbId, seasonNum);
            
            if (!omdbEpisodes || omdbEpisodes.length === 0) {
                throw new Error('No episodes found in OMDb for this season');
            }

            // Convert OMDb episodes to TMDB-compatible format
            const episodes = omdbEpisodes.map((ep, index) => {
                // Parse episode number
                let episodeNumber = index + 1;
                if (ep.Episode) {
                    const epNum = parseInt(ep.Episode);
                    if (!isNaN(epNum)) {
                        episodeNumber = epNum;
                    }
                }

                // Parse air date
                let airDate = '';
                if (ep.Released && ep.Released !== 'N/A') {
                    airDate = ep.Released;
                }

                // Get title
                let name = ep.Title || `Episode ${episodeNumber}`;

                // Get plot/overview
                let overview = '';
                if (ep.Plot && ep.Plot !== 'N/A') {
                    overview = ep.Plot;
                }

                // Parse runtime
                let runtime = null;
                if (ep.Runtime && ep.Runtime !== 'N/A') {
                    const runtimeMatch = ep.Runtime.match(/(\d+)/);
                    if (runtimeMatch) {
                        runtime = parseInt(runtimeMatch[1]);
                    }
                }

                return {
                    episodeNumber: episodeNumber,
                    name: name,
                    overview: overview,
                    airDate: airDate,
                    runtime: runtime,
                    imdbRating: ep.imdbRating && ep.imdbRating !== 'N/A' ? ep.imdbRating : null,
                    imdbId: ep.imdbID || null,
                    isOmdbOnly: true
                };
            });

            log(`Converted ${episodes.length} OMDb episodes to standard format`);

            // Sort episodes by episode number to ensure correct order
            episodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
            log(`✅ Sorted ${episodes.length} episodes by episode number`);
            
            // Store episode data globally
            window.tvdbEpisodeData = {
                season: parseInt(seasonNum),
                episodes: episodes,
                tmdbId: '', // No TMDB ID in OMDb-only mode
                imdbId: imdbId,
                isOmdbOnly: true
            };

            // Generate preview
            const preview = generateStep3Preview(episodes);
            updatePreview(preview);

            updateStatus(`Fetched ${episodes.length} episodes from OMDb for Season ${seasonNum}! Click Fill to populate the form.`);
            log(`OMDb episode fetch completed successfully. Found ${episodes.length} episodes`);

        } catch (error) {
            updateStatus(`Error fetching OMDb episodes: ${error.message}`);
            log('Error fetching OMDb episodes:', error);
        }
    }

    // Fetch episodes using Hoichoi (HTML scraping)
    async function fetchEpisodesHoichoi() {
        const seasonNum = document.getElementById('tvdb-season-num').value.trim();
        const hoichoiUrl = document.getElementById('tvdb-hoichoi-url-step3').value.trim() || window.tvdbFetchedData?.officialSite || '';

        if (!seasonNum) {
            updateStatus('Please enter a season number');
            return;
        }

        if (!hoichoiUrl) {
            updateStatus('Please enter a Hoichoi show URL');
            return;
        }

        // Validate URL format using flexible validation
        if (!isValidHoichoiUrl(hoichoiUrl)) {
            updateStatus(getHoichoiUrlErrorMessage());
            return;
        }

        updateStatus(`Fetching episodes from Hoichoi for Season ${seasonNum}...`);
        log(`Starting Hoichoi episode fetch for URL: ${hoichoiUrl}, Season: ${seasonNum}`);

        try {
            // Strategy: Open Hoichoi page in a hidden iframe or new window to let JavaScript render
            // Then extract from the rendered DOM
            log(`🔍 Attempting to extract episodes from rendered DOM...`);
            
            // First, try to extract from current page if we're already on Hoichoi
            let episodes = [];
            if (window.location.hostname.includes('hoichoi.tv')) {
                log(`✅ Already on Hoichoi domain, extracting from current page DOM`);
                episodes = extractEpisodesFromDOM(seasonNum);
                if (episodes.length > 0) {
                    log(`✅ Found ${episodes.length} episodes from current page DOM`);
                }
            }
            
            // If not found, try opening in iframe
            if (episodes.length === 0) {
                log(`🔍 Opening Hoichoi page in iframe to extract rendered content...`);
                episodes = await extractEpisodesFromIframe(hoichoiUrl, seasonNum);
            }
            
            // Fallback: Fetch HTML and parse (may not have rendered content)
            if (episodes.length === 0) {
                log(`⚠️ DOM extraction failed, falling back to HTML parsing...`);
                
                let html;
                let gmRequest = null;
                try {
                    if (typeof GM_xmlhttpRequest !== 'undefined' && GM_xmlhttpRequest) {
                        gmRequest = GM_xmlhttpRequest;
                    } else if (typeof window !== 'undefined' && window.GM_xmlhttpRequest) {
                        gmRequest = window.GM_xmlhttpRequest;
                    }
                } catch (e) {
                    log('Could not access GM_xmlhttpRequest:', e);
                }

                if (gmRequest) {
                    html = await new Promise((resolve, reject) => {
                        try {
                            gmRequest({
                                method: 'GET',
                                url: hoichoiUrl,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                                },
                                onload: function(response) {
                                    if (response.status >= 200 && response.status < 300) {
                                        resolve(response.responseText);
                                    } else {
                                        reject(new Error(`HTTP ${response.status}: ${response.statusText || 'Unknown error'}`));
                                    }
                                },
                                onerror: function(error) {
                                    reject(new Error(error.error || error.message || 'Network error'));
                                },
                                ontimeout: function() {
                                    reject(new Error('Request timeout'));
                                },
                                timeout: 30000
                            });
                        } catch (err) {
                            reject(new Error(`GM_xmlhttpRequest setup failed: ${err.message || err}`));
                        }
                    });
                } else {
                    const response = await fetch(hoichoiUrl, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    html = await response.text();
                }

            // Log HTML sample for debugging
            log(`📄 HTML fetched: ${html.length} characters`);
            
            // Strategy: Try to find and fetch API endpoints for episodes
            // Look for API URLs in the HTML that might contain episode data
            const apiUrlPatterns = [
                /https?:\/\/[^"'\s]+(?:episode|episodes|content|api)[^"'\s]*/gi,
                /https?:\/\/[^"'\s]+chill[^"'\s]*/gi,
                /https?:\/\/[^"'\s]+trai[^"'\s]*/gi,
                /\/api\/[^"'\s]+(?:episode|content|show)[^"'\s]*/gi,
                // Look for patterns like the network requests we saw: timestamp_show_slug
                /\d+_[a-z_]+\.(?:json|js)/gi
            ];
            
            const foundApiUrls = new Set();
            for (const pattern of apiUrlPatterns) {
                const matches = html.match(pattern);
                if (matches) {
                    matches.forEach(url => {
                        // Clean up URL (remove trailing quotes, etc.)
                        let cleanUrl = url.replace(/["'`;,\)]+$/, '').trim();
                        // Make absolute URL if relative
                        if (cleanUrl.startsWith('/')) {
                            cleanUrl = 'https://www.hoichoi.tv' + cleanUrl;
                        }
                        if (cleanUrl.includes('hoichoi') || cleanUrl.includes('episode') || cleanUrl.includes('content') || cleanUrl.match(/\d+_[a-z_]+/)) {
                            foundApiUrls.add(cleanUrl);
                        }
                    });
                }
            }
            
            log(`🔍 Found ${foundApiUrls.size} potential API URLs in HTML`);
            if (foundApiUrls.size > 0) {
                log(`🔍 API URLs found:`, Array.from(foundApiUrls));
                
                // Try fetching from found URLs
                for (const apiUrl of foundApiUrls) {
                    try {
                        log(`🔍 Trying to fetch from: ${apiUrl}`);
                        let apiResponse;
                        if (gmRequest) {
                            apiResponse = await new Promise((resolve, reject) => {
                                gmRequest({
                                    method: 'GET',
                                    url: apiUrl,
                                    headers: {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                        'Accept': 'application/json, */*'
                                    },
                                    onload: function(response) {
                                        if (response.status >= 200 && response.status < 300) {
                                            try {
                                                const text = response.responseText;
                                                // Try JSON first
                                                try {
                                                    resolve(JSON.parse(text));
                                                } catch (e) {
                                                    // Might be JavaScript, try to extract JSON
                                                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                                                    if (jsonMatch) {
                                                        try {
                                                            resolve(JSON.parse(jsonMatch[0]));
                                                        } catch (e2) {
                                                            resolve(null);
                                                        }
                                                    } else {
                                                        resolve(null);
                                                    }
                                                }
                                            } catch (e) {
                                                resolve(null);
                                            }
                                        } else {
                                            resolve(null);
                                        }
                                    },
                                    onerror: () => resolve(null),
                                    timeout: 10000
                                });
                            });
                        } else {
                            try {
                                const response = await fetch(apiUrl, {
                                    headers: { 'Accept': 'application/json, */*' }
                                });
                                if (response.ok) {
                                    apiResponse = await response.json();
                                }
                            } catch (e) {
                                // Continue to next URL
                            }
                        }
                        
                        if (apiResponse && (Array.isArray(apiResponse) || apiResponse.episodes || apiResponse.data || apiResponse.default)) {
                            log(`✅ Found episode data from detected API: ${apiUrl}`);
                            const episodeArray = Array.isArray(apiResponse) ? apiResponse : 
                                               (apiResponse.episodes || apiResponse.data || apiResponse.default || []);
                            
                            if (Array.isArray(episodeArray) && episodeArray.length > 0) {
                                const parsedEpisodes = episodeArray.map((ep, idx) => ({
                                    episodeNumber: ep.episodeNumber || ep.episode_number || ep.number || ep.index || ep.episodeIndex || (idx + 1),
                                    name: ep.name || ep.title || ep.Title || ep.episodeName || ep.episode_name || `Episode ${ep.episodeNumber || ep.episode_number || ep.number || (idx + 1)}`,
                                    overview: ep.overview || ep.description || ep.plot || ep.synopsis || ep.summary || '',
                                    airDate: ep.airDate || ep.air_date || ep.released || ep.publishedAt || ep.createdAt || '',
                                    runtime: ep.runtime || ep.duration || ep.length || (ep.durationMinutes ? parseInt(ep.durationMinutes) : 0) || 0,
                                    isHoichoiOnly: true,
                                    descriptionSource: 'Hoichoi'
                                }));
                                
                                log(`✅ Successfully parsed ${parsedEpisodes.length} episodes from detected API`);
                                return parsedEpisodes;
                            }
                        }
                    } catch (e) {
                        log(`⚠️ Failed to fetch from ${apiUrl}:`, e.message);
                    }
                }
            }
            
            // Try to construct API endpoint from show URL
            // Hoichoi might use patterns like: /api/shows/{slug}/episodes or /api/content/{id}
            // Use flexible slug extraction to support all URL formats
            const showSlug = extractHoichoiSlug(hoichoiUrl);
            if (showSlug) {
                const potentialApiEndpoints = [
                    `https://www.hoichoi.tv/api/shows/${showSlug}/episodes`,
                    `https://www.hoichoi.tv/api/shows/${showSlug}/seasons/${seasonNum}/episodes`,
                    `https://www.hoichoi.tv/api/content/${showSlug}/episodes`,
                    `https://api.hoichoi.tv/shows/${showSlug}/episodes`,
                    `https://www.hoichoi.tv/shows/${showSlug}/episodes.json`,
                    `https://www.hoichoi.tv/api/v1/shows/${showSlug}/episodes`
                ];
                
                log(`🔍 Trying to fetch from potential API endpoints...`);
                for (const apiUrl of potentialApiEndpoints) {
                    try {
                        let apiResponse;
                        if (gmRequest) {
                            apiResponse = await new Promise((resolve, reject) => {
                                gmRequest({
                                    method: 'GET',
                                    url: apiUrl,
                                    headers: {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                        'Accept': 'application/json'
                                    },
                                    onload: function(response) {
                                        if (response.status >= 200 && response.status < 300) {
                                            try {
                                                resolve(JSON.parse(response.responseText));
                                            } catch (e) {
                                                resolve(null);
                                            }
                                        } else {
                                            resolve(null);
                                        }
                                    },
                                    onerror: () => resolve(null),
                                    timeout: 10000
                                });
                            });
                        } else {
                            try {
                                const response = await fetch(apiUrl, {
                                    headers: { 'Accept': 'application/json' }
                                });
                                if (response.ok) {
                                    apiResponse = await response.json();
                                }
                            } catch (e) {
                                // Continue to next endpoint
                            }
                        }
                        
                        if (apiResponse && (Array.isArray(apiResponse) || apiResponse.episodes || apiResponse.data)) {
                            log(`✅ Found episode data from API: ${apiUrl}`);
                            const episodeArray = Array.isArray(apiResponse) ? apiResponse : 
                                               (apiResponse.episodes || apiResponse.data || []);
                            
                            if (episodeArray.length > 0) {
                                const parsedEpisodes = episodeArray.map((ep, idx) => ({
                                    episodeNumber: ep.episodeNumber || ep.episode_number || ep.number || ep.index || (idx + 1),
                                    name: ep.name || ep.title || ep.Title || ep.episodeName || `Episode ${ep.episodeNumber || ep.episode_number || ep.number || (idx + 1)}`,
                                    overview: ep.overview || ep.description || ep.plot || ep.synopsis || '',
                                    airDate: ep.airDate || ep.air_date || ep.released || ep.publishedAt || '',
                                    runtime: ep.runtime || ep.duration || ep.length || 0,
                                    isHoichoiOnly: true,
                                    descriptionSource: 'Hoichoi'
                                }));
                                
                                log(`✅ Successfully parsed ${parsedEpisodes.length} episodes from API`);
                                return parsedEpisodes;
                            }
                        }
                    } catch (e) {
                        log(`⚠️ API endpoint ${apiUrl} failed:`, e.message);
                    }
                }
            }
            
                // Parse episodes from HTML (fallback)
                episodes = parseHoichoiEpisodes(html, parseInt(seasonNum));
            }
            
            // If still no episodes, throw error
            if (!episodes || episodes.length === 0) {
                throw new Error('No episodes found. Please open the Hoichoi show page in your browser and try again, or check the console for detailed logs.');
            }
            
            log(`📊 Parsing result: ${episodes.length} episodes found`);
            if (episodes.length > 0) {
                log(`📊 First episode sample:`, JSON.stringify(episodes[0], null, 2));
            }
            
            if (!episodes || episodes.length === 0) {
                // Provide more helpful error message with debugging info
                log('❌ Episode parsing failed. HTML length:', html.length);
                log('❌ Attempted multiple parsing strategies but found no episodes.');
                log('❌ HTML contains "episode":', html.toLowerCase().includes('episode'));
                log('❌ HTML contains "S1 E1":', html.includes('S1 E1') || html.includes('S1E1'));
                throw new Error('No episodes found on Hoichoi page. The page structure may have changed or episodes may be loaded dynamically via JavaScript. Check the browser console for detailed logs.');
            }

            // Sort episodes by episode number to ensure correct order
            episodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
            log(`✅ Sorted ${episodes.length} episodes by episode number`);
            
            // Store episode data globally
            window.tvdbEpisodeData = {
                season: parseInt(seasonNum),
                episodes: episodes,
                tmdbId: '', // No TMDB ID in Hoichoi mode
                imdbId: null,
                isHoichoiOnly: true
            };

            // Generate preview
            const preview = generateStep3Preview(episodes);
            updatePreview(preview);

            updateStatus(`Fetched ${episodes.length} episodes from Hoichoi for Season ${seasonNum}! Click Fill to populate the form.`);
            log(`Hoichoi episode fetch completed successfully. Found ${episodes.length} episodes`);

        } catch (error) {
            updateStatus(`Error fetching Hoichoi episodes: ${error.message}`);
            log('Error fetching Hoichoi episodes:', error);
        }
    }

    // Fetch episodes from manual input (paste data)
    async function fetchEpisodesManual() {
        const manualData = document.getElementById('tvdb-manual-episode-data')?.value.trim();
        
        if (!manualData) {
            updateStatus('Please paste episode data in the text area');
            return;
        }

        updateStatus('Parsing manual episode data...');
        log(`Parsing manual episode data (${manualData.length} characters)`);

        try {
            let episodes = [];
            
            // Try parsing as JSON first
            try {
                const jsonData = JSON.parse(manualData);
                if (Array.isArray(jsonData)) {
                    episodes = jsonData.map((ep, idx) => ({
                        episodeNumber: ep.episodeNumber || ep.episode_number || ep.number || ep.index || (idx + 1),
                        name: ep.name || ep.title || ep.Title || ep.episodeName || `Episode ${ep.episodeNumber || ep.episode_number || ep.number || (idx + 1)}`,
                        overview: ep.overview || ep.description || ep.plot || ep.synopsis || ep.summary || '',
                        airDate: ep.airDate || ep.air_date || ep.released || ep.publishedAt || '',
                        runtime: ep.runtime || ep.duration || (ep.runtimeMinutes ? parseInt(ep.runtimeMinutes) : 0) || 0,
                        isHoichoiOnly: true,
                        descriptionSource: 'Manual'
                    }));
                    log(`✅ Parsed ${episodes.length} episodes from JSON`);
                } else if (jsonData.episodes || jsonData.data) {
                    const episodeArray = jsonData.episodes || jsonData.data;
                    episodes = episodeArray.map((ep, idx) => ({
                        episodeNumber: ep.episodeNumber || ep.episode_number || ep.number || ep.index || (idx + 1),
                        name: ep.name || ep.title || ep.Title || ep.episodeName || `Episode ${ep.episodeNumber || ep.episode_number || ep.number || (idx + 1)}`,
                        overview: ep.overview || ep.description || ep.plot || ep.synopsis || ep.summary || '',
                        airDate: ep.airDate || ep.air_date || ep.released || ep.publishedAt || '',
                        runtime: ep.runtime || ep.duration || (ep.runtimeMinutes ? parseInt(ep.runtimeMinutes) : 0) || 0,
                        isHoichoiOnly: true,
                        descriptionSource: 'Manual'
                    }));
                    log(`✅ Parsed ${episodes.length} episodes from JSON object`);
                }
            } catch (e) {
                // Not JSON, try text parsing
                log(`Not JSON format, trying text parsing...`);
                
                // Try CSV format first (from Gemini/AI extraction)
                // Format: "S1 E1,Title - Hindi,9m,Description"
                const lines = manualData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                
                // Check if first line looks like CSV header
                const isCSV = lines[0] && (
                    lines[0].includes('Episode Number') || 
                    lines[0].includes('Title') || 
                    lines[0].includes('Runtime') ||
                    lines[0].includes(',')
                );
                
                if (isCSV && lines.length > 1) {
                    log(`✅ Detected CSV format, parsing ${lines.length - 1} data rows (skipping header)`);
                    // Skip header row - find it first
                    let headerIndex = 0;
                    for (let idx = 0; idx < lines.length; idx++) {
                        if (lines[idx].includes('Episode Number') || lines[idx].includes('Title') || lines[idx].includes('Runtime')) {
                            headerIndex = idx;
                            log(`📊 Found CSV header at line ${idx}: "${lines[idx]}"`);
                            break;
                        }
                    }
                    
                    // Parse data rows starting after header
                    for (let i = headerIndex + 1; i < lines.length; i++) {
                        const line = lines[i];
                        if (!line || line.trim().length === 0) {
                            log(`⚠️ Skipping empty line ${i}`);
                            continue;
                        }
                        log(`📊 Parsing CSV line ${i}: "${line.substring(0, 50)}..."`);
                        // Parse CSV line: "S1 E1,Title - Hindi,9m,Description"
                        // Handle quoted fields that may contain commas
                        const csvFields = [];
                        let currentField = '';
                        let inQuotes = false;
                        
                        for (let j = 0; j < line.length; j++) {
                            const char = line[j];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                csvFields.push(currentField.trim());
                                currentField = '';
                            } else {
                                currentField += char;
                            }
                        }
                        csvFields.push(currentField.trim()); // Add last field
                        
                        if (csvFields.length >= 2) {
                            // Extract episode number from "S1 E1" format
                            let episodeNumber = 1;
                            const epNumMatch = csvFields[0].match(/S\d+\s*E(\d+)|S\d+E(\d+)|[Ee]pisode\s*(\d+)|Ep\s*(\d+)|(\d+)/i);
                            if (epNumMatch) {
                                episodeNumber = parseInt(epNumMatch[1] || epNumMatch[2] || epNumMatch[3] || epNumMatch[4] || epNumMatch[5]);
                                log(`📊 CSV Line ${i}: Extracted episode number ${episodeNumber} from "${csvFields[0]}"`);
                            } else {
                                log(`⚠️ CSV Line ${i}: Could not extract episode number from "${csvFields[0]}"`);
                            }
                            
                            // Extract title (remove language suffix)
                            let title = csvFields[1] || '';
                            title = title.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu|Marathi|Gujarati|Punjabi|Kannada|Malayalam)$/i, '').trim();
                            
                            // Extract runtime (handle "9m" format)
                            let runtime = 0;
                            if (csvFields.length >= 3 && csvFields[2]) {
                                const runtimeMatch = csvFields[2].match(/(\d+)\s*m/i);
                                if (runtimeMatch) {
                                    runtime = parseInt(runtimeMatch[1]);
                                }
                            }
                            
                            // Extract description
                            let overview = '';
                            if (csvFields.length >= 4) {
                                overview = csvFields[3] || '';
                            } else if (csvFields.length >= 3 && !csvFields[2].match(/\d+m/i)) {
                                // If field 3 doesn't look like runtime, it might be description
                                overview = csvFields[2] || '';
                            }
                            
                            episodes.push({
                                episodeNumber: episodeNumber,
                                name: title || `Episode ${episodeNumber}`,
                                overview: overview,
                                airDate: '',
                                runtime: runtime,
                                isHoichoiOnly: true,
                                descriptionSource: 'Manual'
                            });
                            
                            log(`✅ Parsed CSV Episode ${episodeNumber}: "${title}" (${runtime}m)`);
                        }
                    }
                    
                    if (episodes.length > 0) {
                        log(`✅ Successfully parsed ${episodes.length} episodes from CSV format`);
                    }
                }
                
                // If CSV parsing didn't work, try other text formats
                if (episodes.length === 0) {
                    // Try parsing text format like:
                    // 1. Title | 9m | Description
                    // 2. Title | 9m | Description
                    
                    for (const line of lines) {
                    // Try pattern: "1. Title - Hindi | 9m | Description"
                    // Or: "S1 E1: Title - Hindi | 9m | Description"
                    // Or: "Episode 1: Title - Hindi | 9m | Description"
                    const patterns = [
                        /^(?:S\d+\s*E|Episode\s*|Ep\s*)?(\d+)[:.\s-]+\s*(.+?)\s*\|\s*(\d+)m?\s*\|\s*(.+)$/i,
                        /^(\d+)[:.\s-]+\s*(.+?)\s*\|\s*(\d+)m?\s*\|\s*(.+)$/i,
                        /^(\d+)[:.\s-]+\s*(.+?)\s*\|\s*(.+)$/i,
                        /^(\d+)[:.\s-]+\s*(.+)$/i
                    ];
                    
                    for (const pattern of patterns) {
                        const match = line.match(pattern);
                        if (match) {
                            const epNum = parseInt(match[1]);
                            let title = match[2]?.trim() || '';
                            let runtime = 0;
                            let overview = '';
                            
                            if (match[3]) {
                                // Check if match[3] is runtime or part of title
                                if (match[3].match(/^\d+$/)) {
                                    runtime = parseInt(match[3]);
                                    overview = match[4]?.trim() || '';
                                } else {
                                    overview = match[3]?.trim() || '';
                                }
                            }
                            
                            // Remove language suffix from title
                            title = title.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu|Marathi|Gujarati|Punjabi|Kannada|Malayalam)$/i, '').trim();
                            
                            episodes.push({
                                episodeNumber: epNum,
                                name: title || `Episode ${epNum}`,
                                overview: overview,
                                airDate: '',
                                runtime: runtime,
                                isHoichoiOnly: true,
                                descriptionSource: 'Manual'
                            });
                            break;
                        }
                    }
                }
                
                if (episodes.length === 0) {
                    // Try simple numbered list
                    lines.forEach((line, idx) => {
                        const epMatch = line.match(/^(\d+)[:.\s-]+\s*(.+)$/);
                        if (epMatch) {
                            const epNum = parseInt(epMatch[1]);
                            let title = epMatch[2].trim();
                            title = title.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu)$/i, '').trim();
                            episodes.push({
                                episodeNumber: epNum,
                                name: title || `Episode ${epNum}`,
                                overview: '',
                                airDate: '',
                                runtime: 0,
                                isHoichoiOnly: true,
                                descriptionSource: 'Manual'
                            });
                        }
                    });
                    }
                    
                    log(`✅ Parsed ${episodes.length} episodes from text format`);
                }
            }
            
            if (episodes.length === 0) {
                throw new Error('Could not parse episode data. Please use JSON format or text format like: "1. Title | 9m | Description"');
            }
            
            // Sort episodes by episode number to ensure correct order
            episodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
            log(`✅ Sorted ${episodes.length} episodes by episode number`);
            
            // Store episode data globally
            window.tvdbEpisodeData = {
                season: parseInt(document.getElementById('tvdb-season-num')?.value || '1'),
                episodes: episodes,
                tmdbId: '',
                imdbId: null,
                isHoichoiOnly: true
            };

            // Generate preview
            const preview = generateStep3Preview(episodes);
            updatePreview(preview);

            updateStatus(`Parsed ${episodes.length} episodes from manual input! Click Fill to populate the form.`);
            log(`Manual episode parsing completed successfully. Found ${episodes.length} episodes`);

        } catch (error) {
            updateStatus(`Error parsing manual episode data: ${error.message}`);
            log('Error parsing manual episode data:', error);
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

        // Check if this is OMDb-only data
        const isOmdbOnly = episodes.length > 0 && episodes[0].isOmdbOnly;
        
        let html = '';
        
        // Show OMDb-only warning if applicable
        if (isOmdbOnly) {
            html += `<div style="background: #2a3a4a; padding: 8px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #FF9800;">
                <div style="color: #FF9800; font-weight: bold; margin-bottom: 5px;">📦 OMDb-Only Episode Data</div>
                <div style="font-size: 11px; color: #ccc;">Episode data from IMDb. Descriptions may be limited.</div>
            </div>`;
        }
        
        html += `<div style="background: #222; padding: 10px; border-radius: 4px; font-size: 12px; color: #ccc; margin-bottom: 10px;">
            <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">📺 Episodes Preview (${episodes.length} episodes)</div>`;

        episodes.slice(0, 5).forEach((episode, index) => {
            const dataSource = episode.descriptionSource || (isOmdbOnly ? 'OMDb' : 'TMDB');
            const sourceColor = dataSource === 'OMDb' ? '#FF9800' : '#4CAF50';
            
            html += `<div style="margin-bottom: 8px; padding: 5px; background: #333; border-radius: 3px;">
                <div><strong>Episode ${episode.episodeNumber}:</strong> ${episode.name || 'No title'} <span style="color: ${sourceColor}; font-size: 10px;">[${dataSource}]</span></div>
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
        const dataSource = document.getElementById('tvdb-data-source')?.value || 'tmdb';
        
        // Check which mode we're in
        if (dataSource === 'omdb') {
            // OMDb-only mode
            await fetchDataOmdbOnly();
        } else if (dataSource === 'hoichoi') {
            // Hoichoi mode
            await fetchDataHoichoi();
        } else {
            // TMDB mode (original behavior)
            await fetchDataTmdb();
        }
    }

    // Fetch data using TMDB (original behavior)
    async function fetchDataTmdb() {
        const tmdbId = document.getElementById('tvdb-tmdb-id').value.trim();

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

    // Fetch data using OMDb only (no TMDB)
    async function fetchDataOmdbOnly() {
        const imdbId = document.getElementById('tvdb-imdb-id-only').value.trim();

        if (!imdbId) {
            updateStatus('Please enter an IMDb ID');
            return;
        }

        if (!CONFIG.omdbApiKey) {
            updateStatus('Please configure OMDb API key first');
            return;
        }

        // Validate IMDb ID format
        if (!imdbId.match(/^tt\d+$/)) {
            updateStatus('Invalid IMDb ID format. Should be like: tt1234567');
            return;
        }

        updateStatus('Fetching data from OMDb...');
        log('Starting OMDb-only fetch for IMDb ID:', imdbId);

        try {
            // Fetch full OMDb data
            const omdbFullData = await fetchOmdbDataFull(imdbId);
            log('OMDb full data received:', omdbFullData);

            // Convert to TMDB-compatible format
            const tmdbData = convertOmdbToTmdbFormat(omdbFullData);
            log('Converted to TMDB format:', tmdbData);

            // Create simplified OMDb data for compatibility
            const omdbData = {
                title: omdbFullData.Title,
                year: omdbFullData.Year,
                language: omdbFullData.Language,
                imdbId: omdbFullData.imdbID
            };

            // Update context
            context.tmdbId = ''; // No TMDB ID in OMDb-only mode
            context.imdbId = imdbId;
            context.originalIso1 = tmdbData.originalLanguage;
            context.step = 'step1';

            // Store fetched data
            window.tvdbFetchedData = {
                tmdb: tmdbData,
                omdb: omdbData,
                imdbId: imdbId,
                tmdbId: '', // No TMDB ID
                officialSite: '',
                isOmdbOnly: true
            };

            // Update preview
            updatePreview(generateStep1Preview(tmdbData, omdbData, imdbId));

            // Update status
            updateStatus(`OMDb data fetched successfully! IMDb ID: ${imdbId}`);

            saveConfig();
            log('OMDb-only fetch completed', window.tvdbFetchedData);

        } catch (error) {
            updateStatus(`Error fetching OMDb data: ${error.message}`);
            log('Error fetching OMDb data:', error);
        }
    }

    // Fetch data using Hoichoi (HTML scraping)
    async function fetchDataHoichoi() {
        const hoichoiUrl = document.getElementById('tvdb-hoichoi-url').value.trim();

        if (!hoichoiUrl) {
            updateStatus('Please enter a Hoichoi show URL');
            return;
        }

        // Validate URL format using flexible validation
        if (!isValidHoichoiUrl(hoichoiUrl)) {
            updateStatus(getHoichoiUrlErrorMessage());
            return;
        }

        updateStatus('Fetching data from Hoichoi...');
        log('Starting Hoichoi fetch for URL:', hoichoiUrl);

        try {
            // Fetch and scrape Hoichoi show
            const tvdbData = await fetchHoichoiShow(hoichoiUrl);

            // Create simplified data for compatibility
            const omdbData = null; // No OMDb data for Hoichoi

            // Update context
            context.tmdbId = ''; // No TMDB ID in Hoichoi mode
            context.imdbId = null; // No IMDb ID
            context.originalIso1 = tvdbData.originalLanguage;
            context.step = 'step1';

            // Store fetched data
            window.tvdbFetchedData = {
                tmdb: tvdbData,
                omdb: omdbData,
                imdbId: null,
                tmdbId: '', // No TMDB ID
                officialSite: hoichoiUrl, // Use Hoichoi URL as official site
                isHoichoiOnly: true
            };

            // Update preview
            updatePreview(generateStep1Preview(tvdbData, omdbData, null));

            // Update status
            updateStatus(`Hoichoi data fetched successfully! Official site set to: ${hoichoiUrl}`);

            saveConfig();
            log('Hoichoi fetch completed', window.tvdbFetchedData);

        } catch (error) {
            const errorMsg = error.message || error.toString() || 'Unknown error';
            log('Error fetching Hoichoi data:', error);
            log('Error stack:', error.stack);
            log('Error details:', JSON.stringify(error));
            
            // Provide more helpful error message
            let userFriendlyMsg = `Error fetching Hoichoi data: ${errorMsg}`;
            if (errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS')) {
                userFriendlyMsg += '\n\nPossible solutions:\n1. Check Tampermonkey permissions for hoichoi.tv\n2. Make sure @connect www.hoichoi.tv is in script header\n3. Try refreshing the page';
            }
            
            updateStatus(userFriendlyMsg);
        }
    }

    // Generate step 2 preview
    function generateStep2Preview(tmdbData, omdbData) {
        // Check if overview appears to be translated or in original language
        const overviewIsEnglish = tmdbData.overview && isLikelyEnglish(tmdbData.overview);
        const overviewNote = tmdbData.originalLanguage && tmdbData.originalLanguage !== 'en' && overviewIsEnglish 
            ? ' <span style="color: #FF9800; font-size: 10px;">(⚠ English - may need translation)</span>' 
            : '';
        
        return `
            <div style="background: #2a2a2a; padding: 8px; border-radius: 4px; font-size: 11px; color: #ccc; margin-bottom: 8px; border-left: 3px solid #4CAF50;">
                <div style="color: #4CAF50; font-weight: 600; margin-bottom: 6px; font-size: 12px;">📺 Preview</div>
                <div><strong>TMDB Title:</strong> ${tmdbData.name || 'N/A'}</div>
                <div><strong>TMDB Original Title:</strong> ${tmdbData.originalName || 'N/A'}</div>
                <div><strong>TMDB Year:</strong> ${tmdbData.year || 'N/A'}</div>
                <div><strong>TMDB Language:</strong> ${tmdbData.originalLanguage || 'N/A'}</div>
                <div><strong>TMDB Overview:</strong> ${tmdbData.overview ? tmdbData.overview.substring(0, 100) + '...' : 'N/A'}${overviewNote}</div>
                <div><strong>TMDB Genres:</strong> ${tmdbData.genres ? tmdbData.genres.map(g => g.name || g).join(', ') : 'N/A'}</div>
                <div><strong>TMDB Status:</strong> ${tmdbData.status || 'N/A'}</div>
                <div><strong>TMDB Country:</strong> ${tmdbData.originCountry ? tmdbData.originCountry.join(', ') : 'N/A'}</div>
                ${!CONFIG.enableTranslation && tmdbData.originalLanguage && tmdbData.originalLanguage !== 'en' ? `
                    <div style="margin-top: 8px; padding: 6px; background: #443300; border-radius: 3px; font-size: 10px; color: #FFA500;">
                        ⚠ Translation is disabled. Enable it in settings to translate English content.
                    </div>
                ` : ''}
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

        // Check if this is OMDb-only mode
        if (tmdbData && tmdbData.isOmdbOnly) {
            html += `<div style="background: #2a3a4a; padding: 8px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #FF9800;">
                <div style="color: #FF9800; font-weight: bold; margin-bottom: 5px;">📦 OMDb-Only Mode</div>
                <div style="font-size: 11px; color: #ccc;">Limited data available. Episode descriptions may not be available.</div>
            </div>`;
        }

        // Check if this is Hoichoi-only mode
        if (tmdbData && tmdbData.isHoichoiOnly) {
            html += `<div style="background: #3a2a4a; padding: 8px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #9C27B0;">
                <div style="color: #9C27B0; font-weight: bold; margin-bottom: 5px;">📺 Hoichoi Mode</div>
                <div style="font-size: 11px; color: #ccc;">Data scraped from Hoichoi.tv. Official site will be set to Hoichoi URL.</div>
            </div>`;
        }

        if (tmdbData) {
            const originalLangName = LANGUAGE_NAMES[tmdbData.originalLanguage] || tmdbData.originalLanguage;
            let dataSource = 'TMDB';
            if (tmdbData.isOmdbOnly) dataSource = 'OMDb';
            else if (tmdbData.isHoichoiOnly) dataSource = 'Hoichoi';
            
            html += `<div><strong>${dataSource} Title:</strong> ${tmdbData.name} (${tmdbData.year})</div>`;
            if (!tmdbData.isOmdbOnly && !tmdbData.isHoichoiOnly) {
            html += `<div><strong>TMDB Original:</strong> ${tmdbData.originalName} (${tmdbData.year})</div>`;
            }
            html += `<div><strong>Original Language:</strong> ${originalLangName} (${tmdbData.originalLanguage})</div>`;
            if (!tmdbData.isHoichoiOnly) {
            html += `<div><strong>IMDb ID:</strong> ${imdbId || 'Not found'}</div>`;
            }
            if (tmdbData.homepage) {
                html += `<div><strong>Official Site:</strong> <a href="${tmdbData.homepage}" target="_blank" style="color: #4CAF50;">${tmdbData.homepage}</a></div>`;
            }
            if (tmdbData.overview) {
                html += `<div><strong>Overview:</strong> ${tmdbData.overview.substring(0, 150)}...</div>`;
            }
            if (tmdbData.genres && tmdbData.genres.length > 0) {
                const genreNames = tmdbData.genres.map(g => g.name || g).join(', ');
                html += `<div><strong>Genres:</strong> ${genreNames}</div>`;
            }
        }

        if (omdbData && !tmdbData.isOmdbOnly && !tmdbData.isHoichoiOnly) {
            html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;">`;
            html += `<div><strong>IMDb Title:</strong> ${omdbData.title} (${omdbData.year})</div>`;
            html += `<div><strong>IMDb Language:</strong> ${omdbData.language}</div>`;
            html += `</div>`;
        } else if (!omdbData && !tmdbData.isOmdbOnly && !tmdbData.isHoichoiOnly) {
            html += `<div><strong>IMDb Data:</strong> Not available from OMDb</div>`;
        }

        return html;
    }

    // ============================================================
    // Translation Functions
    // ============================================================
    
    /**
     * Detects if text is likely in English
     * Simple heuristic based on character patterns
     */
    function isLikelyEnglish(text) {
        if (!text || text.trim().length === 0) return false;
        
        const textLower = text.toLowerCase();
        
        // Check for common English words
        const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'its', 'yes', 'this', 'that', 'from', 'with', 'have', 'been', 'will', 'they', 'when', 'there', 'their', 'would', 'about', 'which', 'these', 'other', 'time', 'could', 'after', 'first', 'never', 'where', 'should', 'being', 'those', 'right', 'think', 'going', 'until', 'might', 'while', 'years', 'every', 'during', 'before', 'something', 'nothing', 'always', 'between'];
        
        const words = textLower.split(/\s+/);
        let englishWordCount = 0;
        let totalWords = Math.min(words.length, 20); // Check first 20 words
        
        for (let i = 0; i < totalWords && i < words.length; i++) {
            const word = words[i].replace(/[^\w]/g, '');
            if (word.length > 2 && englishWords.includes(word)) {
                englishWordCount++;
            }
        }
        
        // If more than 30% of words are common English words, likely English
        return totalWords > 0 && (englishWordCount / totalWords) > 0.3;
    }
    
    /**
     * Translates text using LibreTranslate (free public API)
     */
    async function translateLibreTranslate(text, targetLang) {
        try {
            // LibreTranslate public endpoints (may have rate limits)
            const endpoints = [
                'https://libretranslate.com/translate',
                'https://libretranslate.de/translate'
            ];
            
            // Map ISO-639-1 to LibreTranslate language codes
            const langMap = {
                'te': 'te', 'ta': 'ta', 'ml': 'ml', 'kn': 'kn', 'hi': 'hi',
                'bn': 'bn', 'gu': 'gu', 'pa': 'pa', 'or': 'or', 'as': 'as',
                'ne': 'ne', 'si': 'si', 'my': 'my', 'km': 'km', 'lo': 'lo',
                'ka': 'ka', 'hy': 'hy', 'az': 'az', 'kk': 'kk', 'ky': 'ky',
                'uz': 'uz', 'tg': 'tg', 'mn': 'mn', 'he': 'he', 'fa': 'fa',
                'ur': 'ur', 'ps': 'ps', 'es': 'es', 'fr': 'fr', 'de': 'de',
                'it': 'it', 'pt': 'pt', 'ru': 'ru', 'ja': 'ja', 'ko': 'ko',
                'zh': 'zh', 'ar': 'ar', 'th': 'th', 'vi': 'vi', 'tr': 'tr'
            };
            
            const targetCode = langMap[targetLang] || targetLang;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            q: text,
                            source: 'en',
                            target: targetCode,
                            format: 'text'
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.translatedText) {
                            log(`Translation successful via LibreTranslate: ${text.substring(0, 50)}... -> ${data.translatedText.substring(0, 50)}...`);
                            return data.translatedText;
                        }
                    }
                } catch (e) {
                    log(`LibreTranslate endpoint ${endpoint} failed:`, e);
                    continue;
                }
            }
            
            throw new Error('All LibreTranslate endpoints failed');
        } catch (error) {
            log('LibreTranslate error:', error);
            throw error;
        }
    }
    
    /**
     * Translates text using MyMemory Translation API (free tier)
     */
    async function translateMyMemory(text, targetLang) {
        try {
            // MyMemory free API endpoint
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`MyMemory API error: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                const translated = data.responseData.translatedText;
                log(`Translation successful via MyMemory: ${text.substring(0, 50)}... -> ${translated.substring(0, 50)}...`);
                return translated;
            } else {
                throw new Error('MyMemory translation failed');
            }
        } catch (error) {
            log('MyMemory translation error:', error);
            throw error;
        }
    }
    
    /**
     * Main translation function that selects the appropriate service
     */
    async function translateText(text, targetLang) {
        if (!text || !targetLang || !CONFIG.enableTranslation) {
            return text;
        }
        
        if (targetLang === 'en') {
            return text; // Already in target language
        }
        
        // Skip if translation service is disabled
        if (CONFIG.translationService === 'none') {
            return text;
        }
        
        try {
            updateStatus(`Translating to ${targetLang}...`);
            log(`Translating text: "${text.substring(0, 100)}..." to ${targetLang}`);
            
            let translated;
            if (CONFIG.translationService === 'libretranslate') {
                translated = await translateLibreTranslate(text, targetLang);
            } else if (CONFIG.translationService === 'mymemory') {
                translated = await translateMyMemory(text, targetLang);
            } else {
                log(`Unknown translation service: ${CONFIG.translationService}`);
                return text;
            }
            
            return translated || text;
        } catch (error) {
            log(`Translation failed: ${error.message}`);
            updateStatus(`Translation failed: ${error.message}`);
            return text; // Return original text on failure
        }
    }
    
    /**
     * Check TMDB translations and translate if needed
     * Returns object with originalName and overview in original language
     */
    async function getTranslatedTitleAndOverview(tmdbData) {
        const originalLang = tmdbData.originalLanguage;
        
        // If original language is English, no translation needed
        if (!originalLang || originalLang === 'en') {
            return {
                originalName: tmdbData.originalName || tmdbData.name,
                overview: tmdbData.overview
            };
        }
        
        // First, check if TMDB has translations for the original language
        if (tmdbData.translations && tmdbData.translations.length > 0) {
            const originalLangTranslation = tmdbData.translations.find(t => 
                t.iso_639_1 === originalLang && t.iso_3166_1 === originalLang.toUpperCase()
            ) || tmdbData.translations.find(t => t.iso_639_1 === originalLang);
            
            if (originalLangTranslation && originalLangTranslation.data) {
                const transData = originalLangTranslation.data;
                const translatedName = transData.name || transData.title;
                const translatedOverview = transData.overview;
                
                // Use translation if available and not empty
                if (translatedName && translatedName.trim()) {
                    log(`Found TMDB translation for ${originalLang}: ${translatedName.substring(0, 50)}...`);
                    return {
                        originalName: translatedName,
                        overview: translatedOverview || tmdbData.overview
                    };
                }
            }
        }
        
        // If no TMDB translation found, check if current data is in English
        const currentName = tmdbData.originalName || tmdbData.name;
        const currentOverview = tmdbData.overview;
        
        const nameIsEnglish = isLikelyEnglish(currentName);
        const overviewIsEnglish = currentOverview && isLikelyEnglish(currentOverview);
        
        // Always try to translate if:
        // 1. Original language is not English, AND
        // 2. (Content appears to be in English OR we have no TMDB translation)
        const hasTmdbTranslation = tmdbData.translations && tmdbData.translations.some(t => 
            t.iso_639_1 === originalLang && t.data?.overview && t.data.overview.trim() && !isLikelyEnglish(t.data.overview)
        );
        
        const shouldTranslate = originalLang && originalLang !== 'en' && CONFIG.enableTranslation &&
                               (nameIsEnglish || overviewIsEnglish || (!hasTmdbTranslation && currentOverview && currentOverview.length > 0));
        
        if (shouldTranslate) {
            log(`Attempting to translate content to ${originalLang}...`);
            log(`  Name is English: ${nameIsEnglish}, Overview is English: ${overviewIsEnglish}`);
            
            const results = {
                originalName: currentName,
                overview: currentOverview
            };
            
            // Translate title if it appears to be English
            if (nameIsEnglish && currentName) {
                try {
                    const translated = await translateText(currentName, originalLang);
                    if (translated && translated !== currentName) {
                        results.originalName = translated;
                        log(`✓ Translated title: ${translated.substring(0, 50)}...`);
                    }
                } catch (error) {
                    log(`Failed to translate title: ${error.message}`);
                }
            }
            
            // Always try to translate overview if it appears to be English
            if (overviewIsEnglish && currentOverview && currentOverview.trim()) {
                try {
                    updateStatus(`Translating overview to ${originalLang}...`);
                    const translated = await translateText(currentOverview, originalLang);
                    if (translated && translated !== currentOverview && translated.trim().length > 0) {
                        results.overview = translated;
                        log(`✓ Translated overview: ${translated.substring(0, 100)}...`);
                        updateStatus(`Overview translated successfully!`);
                    } else {
                        log(`Translation returned same or empty text, using original`);
                        updateStatus(`Translation didn't change text. Using original overview.`);
                    }
                } catch (error) {
                    log(`Failed to translate overview: ${error.message}`);
                    // Show error in status
                    updateStatus(`Translation failed: ${error.message}. Using original overview.`);
                }
            } else if (!overviewIsEnglish && currentOverview) {
                log(`Overview doesn't appear to be in English, using as-is`);
            }
            
            return results;
        }
        
        // If content doesn't appear to be English and translation is disabled, use as-is
        log(`Using content as-is (English detection: name=${nameIsEnglish}, overview=${overviewIsEnglish}, translation enabled=${CONFIG.enableTranslation})`);
        return {
            originalName: currentName,
            overview: currentOverview
        };
    }

    // Fetch TMDB data
    async function fetchTmdbData(tmdbId) {
        // First fetch with default language (usually English)
        const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${CONFIG.tmdbApiKey}&append_to_response=external_ids,images,translations`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const result = {
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
        
        log(`🔍 TMDB API Response for ${data.id}:`);
        log(`  Original Language: ${data.original_language}`);
        log(`  Name: ${data.name}`);
        log(`  Original Name: ${data.original_name}`);
        log(`  Overview: ${data.overview ? data.overview.substring(0, 100) + '...' : 'None'}`);
        log(`  Origin Country: ${data.origin_country?.join(', ') || 'None'}`);
        
        // If original language is not English, try fetching with original language parameter
        if (data.original_language && data.original_language !== 'en' && data.original_language !== 'en-US') {
            const langUrl = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${CONFIG.tmdbApiKey}&language=${data.original_language}`;
            try {
                const langResponse = await fetch(langUrl);
                if (langResponse.ok) {
                    const langData = await langResponse.json();
                    log(`🔍 TMDB API Response (${data.original_language}):`);
                    log(`  Name: ${langData.name}`);
                    log(`  Overview: ${langData.overview ? langData.overview.substring(0, 100) + '...' : 'None'}`);
                    
                    // If we got data in original language, use it
                    if (langData.name && langData.name.trim()) {
                        // Check if the name is actually in the original language (not English)
                        if (!isLikelyEnglish(langData.name)) {
                            result.originalName = langData.name;
                            log(`✓ Using original language name from TMDB: ${langData.name}`);
                        }
                    }
                    if (langData.overview && langData.overview.trim()) {
                        // Check if the overview is actually in the original language (not English)
                        const overviewIsEnglish = isLikelyEnglish(langData.overview);
                        if (!overviewIsEnglish) {
                            result.overview = langData.overview;
                            log(`✓ Using original language overview from TMDB (not English)`);
                        } else {
                            log(`⚠ TMDB returned English overview even when requesting ${data.original_language}. Will attempt translation.`);
                        }
                    } else if (!langData.overview || !langData.overview.trim()) {
                        log(`⚠ TMDB has no overview in ${data.original_language}, using default (likely English)`);
                    }
                }
            } catch (error) {
                log(`Failed to fetch TMDB data in ${data.original_language}:`, error);
            }
        }
        
        return result;
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

    // Fetch full OMDb data by IMDb ID (for OMDb-only mode)
    async function fetchOmdbDataFull(imdbId) {
        const url = `https://www.omdbapi.com/?apikey=${CONFIG.omdbApiKey}&i=${imdbId}&type=series`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.Response === 'False') {
            throw new Error(`OMDb error: ${data.Error || 'Show not found'}`);
        }

        return data;
    }

    // Convert OMDb data to TMDB-compatible format
    function convertOmdbToTmdbFormat(omdbData) {
        // Parse year from Year field (e.g., "2010-2020" or "2010-")
        let year = '';
        if (omdbData.Year) {
            const yearMatch = omdbData.Year.match(/^(\d{4})/);
            if (yearMatch) {
                year = yearMatch[1];
            }
        }

        // Parse genres
        let genres = [];
        if (omdbData.Genre && omdbData.Genre !== 'N/A') {
            genres = omdbData.Genre.split(',').map(g => g.trim());
        }

        // Parse country
        let originCountry = [];
        if (omdbData.Country && omdbData.Country !== 'N/A') {
            originCountry = omdbData.Country.split(',').map(c => c.trim());
        }

        // Parse language (use first one as original language)
        let originalLanguage = 'en';
        if (omdbData.Language && omdbData.Language !== 'N/A') {
            const firstLang = omdbData.Language.split(',')[0].trim().toLowerCase();
            // Convert to ISO 639-1 codes (simple mapping)
            const langMap = {
                'english': 'en',
                'spanish': 'es',
                'french': 'fr',
                'german': 'de',
                'italian': 'it',
                'portuguese': 'pt',
                'russian': 'ru',
                'japanese': 'ja',
                'korean': 'ko',
                'chinese': 'zh'
            };
            originalLanguage = langMap[firstLang] || 'en';
        }

        // Map status
        let status = 'Ended';
        if (omdbData.Year && omdbData.Year.endsWith('–')) {
            status = 'Returning Series';
        }

        return {
            name: omdbData.Title || '',
            originalName: omdbData.Title || '',
            overview: omdbData.Plot && omdbData.Plot !== 'N/A' ? omdbData.Plot : '',
            year: year,
            originalLanguage: originalLanguage,
            genres: genres,
            status: status,
            originCountry: originCountry,
            imdbId: omdbData.imdbID || null,
            homepage: '',
            runtime: omdbData.Runtime && omdbData.Runtime !== 'N/A' ? parseInt(omdbData.Runtime) : null,
            rating: omdbData.imdbRating && omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : null,
            isOmdbOnly: true // Flag to indicate this is OMDb-only data
        };
    }

    // ============================================================
    // Hoichoi Scraper Functions
    // ============================================================

    // Flexible Hoichoi URL validation - accepts multiple formats
    function isValidHoichoiUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        // Normalize URL - ensure it has protocol
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }
        
        // Check if it's a hoichoi.tv domain
        if (!normalizedUrl.includes('hoichoi.tv')) {
            return false;
        }
        
        // Accept multiple URL patterns:
        // - /shows/show-slug (plural)
        // - /show/show-slug (singular)
        // - /webseries/show-slug
        // - /series/show-slug
        // - /content/show-slug
        const validPatterns = [
            /hoichoi\.tv\/shows\/[^\/\s]+/i,
            /hoichoi\.tv\/show\/[^\/\s]+/i,
            /hoichoi\.tv\/webseries\/[^\/\s]+/i,
            /hoichoi\.tv\/series\/[^\/\s]+/i,
            /hoichoi\.tv\/content\/[^\/\s]+/i
        ];
        
        return validPatterns.some(pattern => pattern.test(normalizedUrl));
    }

    // Extract show slug from Hoichoi URL (works with all formats)
    function extractHoichoiSlug(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }
        
        // Normalize URL
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }
        
        // Try to extract slug from various patterns
        const slugPatterns = [
            /hoichoi\.tv\/shows\/([^\/\s?#]+)/i,
            /hoichoi\.tv\/show\/([^\/\s?#]+)/i,
            /hoichoi\.tv\/webseries\/([^\/\s?#]+)/i,
            /hoichoi\.tv\/series\/([^\/\s?#]+)/i,
            /hoichoi\.tv\/content\/([^\/\s?#]+)/i
        ];
        
        for (const pattern of slugPatterns) {
            const match = normalizedUrl.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }

    // Get user-friendly error message for invalid Hoichoi URLs
    function getHoichoiUrlErrorMessage() {
        return 'Invalid Hoichoi URL. Expected formats:\n' +
               '• https://www.hoichoi.tv/shows/show-slug\n' +
               '• https://www.hoichoi.tv/show/show-slug\n' +
               '• https://www.hoichoi.tv/webseries/show-slug\n' +
               '• https://www.hoichoi.tv/series/show-slug\n' +
               '• https://www.hoichoi.tv/content/show-slug';
    }

    // Fetch and scrape Hoichoi show page
    async function fetchHoichoiShow(url) {
        try {
            log(`🔍 Fetching Hoichoi show from: ${url}`);
            updateStatus('Fetching data from Hoichoi...');

            // Validate URL using flexible validation
            if (!isValidHoichoiUrl(url)) {
                throw new Error(getHoichoiUrlErrorMessage());
            }

            // Ensure URL has protocol
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            // Fetch page HTML using GM_xmlhttpRequest (works better with CORS in Tampermonkey)
            let html;
            
            // Check for GM_xmlhttpRequest in multiple ways (Tampermonkey exposes it differently)
            let gmRequest = null;
            try {
                if (typeof GM_xmlhttpRequest !== 'undefined' && GM_xmlhttpRequest) {
                    gmRequest = GM_xmlhttpRequest;
                } else if (typeof window !== 'undefined' && window.GM_xmlhttpRequest) {
                    gmRequest = window.GM_xmlhttpRequest;
                }
            } catch (e) {
                // unsafeWindow or other access might fail, ignore
                log('Could not access GM_xmlhttpRequest:', e);
            }
            
            log(`GM_xmlhttpRequest available: ${!!gmRequest}`);
            
            if (gmRequest) {
                // Use GM_xmlhttpRequest if available (Tampermonkey)
                log('Using GM_xmlhttpRequest for cross-origin request');
                html = await new Promise((resolve, reject) => {
                    try {
                        gmRequest({
                            method: 'GET',
                            url: url,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                            },
                            onload: function(response) {
                                log(`GM_xmlhttpRequest response status: ${response.status}`);
                                if (response.status >= 200 && response.status < 300) {
                                    log('✅ Page HTML fetched successfully via GM_xmlhttpRequest');
                                    resolve(response.responseText);
                                } else {
                                    const errorMsg = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
                                    log(`❌ GM_xmlhttpRequest failed: ${errorMsg}`);
                                    reject(new Error(errorMsg));
                                }
                            },
                            onerror: function(error) {
                                log('❌ GM_xmlhttpRequest onerror called:', JSON.stringify(error));
                                const errorMsg = error.error || error.message || 'Network error: Failed to fetch';
                                reject(new Error(errorMsg));
                            },
                            ontimeout: function() {
                                log('❌ GM_xmlhttpRequest timeout');
                                reject(new Error('Request timeout after 30 seconds'));
                            },
                            timeout: 30000 // 30 second timeout
                        });
                    } catch (err) {
                        log('❌ Exception in GM_xmlhttpRequest setup:', err);
                        reject(new Error(`GM_xmlhttpRequest setup failed: ${err.message || err}`));
                    }
                });
            } else {
                // Fallback to fetch (for other userscript managers or if GM_xmlhttpRequest not available)
                log('⚠️ GM_xmlhttpRequest not available, using fetch (may fail due to CORS)');
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    html = await response.text();
                    log('✅ Page HTML fetched successfully via fetch');
                } catch (fetchError) {
                    log('❌ Fetch error details:', fetchError);
                    const errorMsg = fetchError.message || 'CORS or network error. Make sure @connect www.hoichoi.tv is in the script header.';
                    throw new Error('Failed to fetch: ' + errorMsg);
                }
            }

            // Parse the page
            const scrapedData = parseHoichoiPage(html, url);
            log('✅ Page parsed successfully');

            // Convert to TVDB format
            const tvdbData = convertHoichoiToTvdbFormat(scrapedData, url);
            log('✅ Data converted to TVDB format');

            return tvdbData;

        } catch (error) {
            log(`❌ Error fetching Hoichoi show: ${error.message}`);
            throw error;
        }
    }

    // Parse Hoichoi page HTML to extract show data
    function parseHoichoiPage(html, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract title from page title or h1
        let title = '';
        const pageTitle = doc.querySelector('title');
        if (pageTitle) {
            // Page title format: "Watch Chill Dil | Hindi Web Series | hoichoi"
            const titleMatch = pageTitle.textContent.match(/Watch\s+(.+?)\s*\||(.+?)\s*\|/);
            if (titleMatch) {
                title = (titleMatch[1] || titleMatch[2]).trim();
            }
        }
        
        // Fallback: try h1 or other title elements
        if (!title) {
            const titleElement = doc.querySelector('h1') || doc.querySelector('[class*="title"]');
            if (titleElement) {
                title = titleElement.textContent.trim();
                // Remove language indicator like "(Hindi)" from title
                title = title.replace(/\s*\([^)]+\)\s*$/, '').trim();
            }
        }

        // Extract description/overview from meta tags
        let description = '';
        const metaDesc = doc.querySelector('meta[name="description"], meta[property="og:description"]');
        if (metaDesc) {
            description = metaDesc.getAttribute('content') || metaDesc.getAttribute('property') || '';
        }
        
        // Try to find description in page content (look for longer text blocks)
        if (!description || description.length < 50) {
            const descElements = doc.querySelectorAll('p, div, [class*="description"], [class*="synopsis"], [class*="overview"]');
            for (const el of descElements) {
                const text = el.textContent.trim();
                // Look for description-like text (50-1000 chars, not too short)
                if (text.length > 50 && text.length < 1000 && 
                    !text.includes('Subscribe') && 
                    !text.includes('Watch') &&
                    !text.includes('Season')) {
                    description = text;
                    break;
                }
            }
        }

        // Extract year and genres from metadata pattern: "U • 1 Season • 2024 • Romantic | Comedy"
        let year = '';
        let genres = [];
        let language = 'bn'; // Default to Bengali
        
        // Look for metadata pattern in HTML
        const metadataPattern = /([A-Z])\s*•\s*(\d+\s+Season)?\s*•\s*(\d{4})\s*•\s*([^•]+)/i;
        const metadataMatch = html.match(metadataPattern);
        
        if (metadataMatch) {
            year = metadataMatch[3] || '';
            const genresText = metadataMatch[4] || '';
            // Split genres by | and clean up
            genres = genresText.split('|').map(g => g.trim()).filter(Boolean);
        } else {
            // Fallback: extract year from anywhere in HTML
            const yearPattern = /\b(20\d{2}|19\d{2})\b/;
            const yearMatches = html.match(yearPattern);
            if (yearMatches) {
                // Prefer recent years (2000+)
                year = yearMatches.find(y => parseInt(y) >= 2000) || yearMatches[0];
            }
            
            // Fallback: extract genres from common patterns
            const genrePattern = /(Romantic|Comedy|Drama|Thriller|Action|Horror|Sci-Fi|Fantasy|Crime|Mystery|Adventure|Family|Animation|Documentary|Romance)[^|]*/gi;
            const genreMatches = html.match(genrePattern);
            if (genreMatches) {
                genres = [...new Set(genreMatches.map(g => g.trim()))];
            }
        }

        // Extract language from title, metadata, or page
        const langPatterns = [
            /\(Hindi\)/i,
            /\(Bengali\)/i,
            /\(English\)/i,
            /\(Tamil\)/i,
            /\(Telugu\)/i,
            /Hindi\s+Web\s+Series/i,
            /Bengali\s+Web\s+Series/i
        ];
        
        for (const pattern of langPatterns) {
            const match = html.match(pattern);
            if (match) {
                const langText = match[0].toLowerCase();
                if (langText.includes('hindi')) { language = 'hi'; break; }
                else if (langText.includes('bengali')) { language = 'bn'; break; }
                else if (langText.includes('english')) { language = 'en'; break; }
                else if (langText.includes('tamil')) { language = 'ta'; break; }
                else if (langText.includes('telugu')) { language = 'te'; break; }
            }
        }

        // Extract poster/image URL (prefer larger images)
        let posterUrl = '';
        // Look for og:image meta tag first
        const ogImage = doc.querySelector('meta[property="og:image"]');
        if (ogImage) {
            posterUrl = ogImage.getAttribute('content') || '';
        }
        
        // Fallback: find image URLs in HTML
        if (!posterUrl) {
            const imagePatterns = [
                /image\.hoichoicdn\.com[^"'\s]+1280x720[^"'\s]+/i,  // Prefer 1280x720
                /image\.hoichoicdn\.com[^"'\s]+/i  // Any hoichoi image
            ];
            
            for (const pattern of imagePatterns) {
                const imageMatch = html.match(pattern);
                if (imageMatch) {
                    posterUrl = 'https://' + imageMatch[0];
                    break;
                }
            }
        }

        log(`📊 Parsed Hoichoi data: Title="${title}", Year="${year}", Language="${language}", Genres=[${genres.join(', ')}]`);

        return {
            title: title,
            description: description,
            year: year,
            genres: genres,
            language: language,
            posterUrl: posterUrl,
            url: url
        };
    }

    // Extract episodes directly from rendered DOM (most reliable for client-side rendered content)
    function extractEpisodesFromDOM(seasonNum) {
        const episodes = [];
        log(`🔍 Extracting episodes from current page DOM...`);
        
        // Look for episode cards/elements in the rendered page
        const episodeSelectors = [
            '[class*="episode-card"]',
            '[class*="EpisodeCard"]',
            '[class*="episode-item"]',
            '[class*="EpisodeItem"]',
            '[data-episode]',
            '[class*="card"][class*="episode"]',
            'a[href*="/episode"]',
            'a[href*="/watch"]',
            '[class*="episode"]'
        ];
        
        let episodeElements = [];
        for (const selector of episodeSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0 && elements.length < 100) {
                log(`✅ Found ${elements.length} elements with selector: ${selector}`);
                episodeElements = Array.from(elements);
                break;
            }
        }
        
        // Extract episode data from each element
        episodeElements.forEach((element, index) => {
            try {
                const text = element.textContent || '';
                
                // Extract episode number from "S1 E1" format
                let episodeNumber = index + 1;
                const s1e1Match = text.match(/S\d+\s*E(\d+)|S\d+E(\d+)/i);
                if (s1e1Match) {
                    episodeNumber = parseInt(s1e1Match[1] || s1e1Match[2]);
                } else {
                    const epMatch = text.match(/[Ee]pisode\s*(\d+)|Ep\s*(\d+)|E\s*(\d+)/);
                    if (epMatch) {
                        episodeNumber = parseInt(epMatch[1] || epMatch[2] || epMatch[3]);
                    }
                }
                
                // Extract title
                let name = '';
                const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[class*="title"]', '[class*="name"]'];
                for (const sel of titleSelectors) {
                    const titleEl = element.querySelector(sel);
                    if (titleEl) {
                        name = titleEl.textContent.trim();
                        name = name.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu)$/i, '');
                        name = name.replace(/^S\d+\s*E\d+[:\s-]*/i, '');
                        name = name.replace(/^[Ee]pisode\s*\d+[:\s-]*/i, '');
                        if (name.length > 2) break;
                    }
                }
                
                if (!name || name.length < 2) {
                    const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
                    for (const line of lines) {
                        if (!line.match(/^(S\d+\s*E\d+|Episode\s*\d+|Ep\s*\d+|E\d+|\d+m)$/i) && 
                            line.length > 3 && line.length < 100) {
                            name = line.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu)$/i, '').trim();
                            break;
                        }
                    }
                }
                
                if (!name || name.length < 2) {
                    name = `Episode ${episodeNumber}`;
                }
                
                // Extract description
                let overview = '';
                const descSelectors = ['[class*="description"]', '[class*="overview"]', '[class*="synopsis"]', 'p'];
                for (const sel of descSelectors) {
                    const descEl = element.querySelector(sel);
                    if (descEl) {
                        const descText = descEl.textContent.trim();
                        if (descText.length > 20 && descText.length < 500 && descText !== name) {
                            overview = descText;
                            break;
                        }
                    }
                }
                
                // Extract runtime
                let runtime = 0;
                const runtimeMatch = text.match(/(\d+)\s*m\b/i);
                if (runtimeMatch) {
                    runtime = parseInt(runtimeMatch[1]);
                }
                
                episodes.push({
                    episodeNumber: episodeNumber,
                    name: name,
                    overview: overview,
                    airDate: '',
                    runtime: runtime,
                    isHoichoiOnly: true,
                    descriptionSource: 'Hoichoi'
                });
                
                log(`✅ Extracted Episode ${episodeNumber}: "${name}" (${runtime}m)`);
            } catch (error) {
                log(`⚠️ Error extracting episode ${index}:`, error);
            }
        });
        
        return episodes;
    }
    
    // Extract episodes from iframe (for cross-origin)
    async function extractEpisodesFromIframe(url, seasonNum) {
        return new Promise((resolve) => {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.src = url;
                document.body.appendChild(iframe);
                
                iframe.onload = function() {
                    setTimeout(() => {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                            if (iframeDoc) {
                                const html = iframeDoc.documentElement.outerHTML;
                                const episodes = parseHoichoiEpisodes(html, seasonNum);
                                document.body.removeChild(iframe);
                                resolve(episodes);
                            } else {
                                document.body.removeChild(iframe);
                                resolve([]);
                            }
                        } catch (e) {
                            log(`⚠️ Cannot access iframe content (CORS):`, e);
                            document.body.removeChild(iframe);
                            resolve([]);
                        }
                    }, 3000);
                };
                
                setTimeout(() => {
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                    resolve([]);
                }, 10000);
            } catch (e) {
                log(`⚠️ Error creating iframe:`, e);
                resolve([]);
            }
        });
    }

    // Parse episodes from Hoichoi page HTML
    function parseHoichoiEpisodes(html, seasonNum) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const episodes = [];

        log(`🔍 Parsing Hoichoi episodes for season ${seasonNum}`);
        log(`🔍 HTML length: ${html.length} characters`);

        // Strategy 1: Try to extract from JSON data in script tags (most reliable)
        try {
            const scriptTags = doc.querySelectorAll('script[type="application/json"], script[id*="__NEXT_DATA__"], script[id*="__NEXT"], script:not([src])');
            log(`🔍 Found ${scriptTags.length} script tags to check for JSON data`);
            
            for (let i = 0; i < scriptTags.length; i++) {
                const script = scriptTags[i];
                try {
                    const scriptText = script.textContent || script.innerHTML;
                    if (!scriptText || scriptText.length < 100) continue;
                    
                    log(`🔍 Checking script tag ${i + 1}/${scriptTags.length} (${scriptText.length} chars)`);

                    // Try parsing entire script as JSON first (most comprehensive)
                    try {
                        const fullData = JSON.parse(scriptText);
                        log(`✅ Successfully parsed script tag ${i + 1} as JSON`);
                        
                        // Enhanced recursive search for episodes
                        const searchForEpisodes = (obj, path = '', depth = 0) => {
                            if (depth > 10) return null; // Prevent infinite recursion
                            if (!obj || typeof obj !== 'object') return null;
                            
                            // Check if this is an array of episodes
                            if (Array.isArray(obj) && obj.length > 0) {
                                const firstItem = obj[0];
                                if (firstItem && typeof firstItem === 'object') {
                                    // Check if it looks like an episode object
                                    const hasEpisodeFields = 
                                        firstItem.episodeNumber || firstItem.episode_number || 
                                        firstItem.number || firstItem.Episode ||
                                        firstItem.episode || firstItem.ep ||
                                        firstItem.title || firstItem.name || firstItem.Title ||
                                        firstItem.episodeName || firstItem.episode_name;
                                    
                                    if (hasEpisodeFields) {
                                        log(`✅ Found episode array at path: ${path} (${obj.length} items)`);
                                        return obj;
                                    }
                                }
                            }
                            
                            // Check object keys for episode-related fields
                            for (const key in obj) {
                                const keyLower = key.toLowerCase();
                                
                                // Direct episode array
                                if ((keyLower.includes('episode') || keyLower.includes('ep')) && 
                                    Array.isArray(obj[key]) && obj[key].length > 0) {
                                    log(`✅ Found episode array at key: ${key} (${obj[key].length} items)`);
                                    return obj[key];
                                }
                                
                                // Nested search
                                if (typeof obj[key] === 'object' && obj[key] !== null) {
                                    const found = searchForEpisodes(obj[key], path + '.' + key, depth + 1);
                                    if (found) return found;
                                }
                            }
                            
                            return null;
                        };
                        
                        const foundEpisodes = searchForEpisodes(fullData);
                        if (foundEpisodes && foundEpisodes.length > 0) {
                            log(`✅ Found ${foundEpisodes.length} episodes in JSON structure`);
                            foundEpisodes.forEach((ep, idx) => {
                                if (!ep || typeof ep !== 'object') return;
                                
                                // Extract episode number
                                const epNum = ep.episodeNumber || ep.episode_number || ep.number || 
                                            ep.Episode || ep.episode || ep.ep || ep.index || (idx + 1);
                                
                                // Extract title
                                const title = ep.name || ep.title || ep.Title || ep.episodeName || 
                                            ep.episode_name || ep.episodeTitle || ep.episode_title ||
                                            ep.displayName || ep.display_name || '';
                                
                                // Extract description
                                const desc = ep.overview || ep.description || ep.plot || ep.Plot || 
                                           ep.synopsis || ep.Synopsis || ep.summary || ep.Summary || '';
                                
                                // Extract runtime (handle both minutes and seconds)
                                let runtime = 0;
                                if (ep.runtime) runtime = parseInt(ep.runtime);
                                else if (ep.duration) {
                                    const dur = ep.duration;
                                    if (typeof dur === 'number') runtime = dur;
                                    else if (typeof dur === 'string') {
                                        const match = dur.match(/(\d+)/);
                                        if (match) runtime = parseInt(match[1]);
                                    }
                                } else if (ep.length) {
                                    const len = ep.length;
                                    if (typeof len === 'number') runtime = len;
                                    else if (typeof len === 'string') {
                                        const match = len.match(/(\d+)/);
                                        if (match) runtime = parseInt(match[1]);
                                    }
                                }
                                
                                // Extract air date
                                const airDate = ep.airDate || ep.air_date || ep.released || ep.Released || 
                                             ep.publishedAt || ep.published_at || ep.createdAt || ep.created_at || '';
                                
                                episodes.push({
                                    episodeNumber: parseInt(epNum) || (idx + 1),
                                    name: title || `Episode ${parseInt(epNum) || (idx + 1)}`,
                                    overview: desc,
                                    airDate: airDate,
                                    runtime: runtime,
                                    isHoichoiOnly: true,
                                    descriptionSource: 'Hoichoi'
                                });
                                
                                log(`✅ Parsed Episode ${parseInt(epNum) || (idx + 1)}: "${title || 'No title'}" (${runtime}m)`);
                            });
                            
                            if (episodes.length > 0) {
                                log(`✅ Successfully parsed ${episodes.length} episodes from JSON`);
                                return episodes;
                            }
                        }
                    } catch (e) {
                        // Not valid JSON, try partial matching
                        log(`⚠️ Script tag ${i + 1} is not valid JSON, trying partial match...`);
                        
                        // Try to find episode data in JSON-like strings
                        const jsonMatches = scriptText.match(/\{[^{}]*(?:episodes|episode|Episodes|Episode)[^{}]*\}/g);
                        if (jsonMatches) {
                            for (const jsonStr of jsonMatches) {
                                try {
                                    const data = JSON.parse(jsonStr);
                                    if (data.episodes || data.Episodes || (Array.isArray(data) && data.length > 0)) {
                                        const foundEpisodes = data.episodes || data.Episodes || data;
                                        if (Array.isArray(foundEpisodes) && foundEpisodes.length > 0) {
                                            log(`✅ Found ${foundEpisodes.length} episodes in partial JSON match`);
                                            foundEpisodes.forEach((ep, idx) => {
                                                if (ep && (ep.episodeNumber || ep.episode_number || ep.number || ep.Episode || idx >= 0)) {
                                                    episodes.push({
                                                        episodeNumber: ep.episodeNumber || ep.episode_number || ep.number || ep.Episode || (idx + 1),
                                                        name: ep.name || ep.title || ep.Title || `Episode ${ep.episodeNumber || ep.episode_number || ep.number || ep.Episode || (idx + 1)}`,
                                                        overview: ep.overview || ep.description || ep.plot || ep.Plot || '',
                                                        airDate: ep.airDate || ep.air_date || ep.released || ep.Released || '',
                                                        runtime: ep.runtime || ep.duration || 0,
                                                        isHoichoiOnly: true,
                                                        descriptionSource: 'Hoichoi'
                                                    });
                                                }
                                            });
                                            if (episodes.length > 0) {
                                                log(`✅ Successfully parsed ${episodes.length} episodes from partial JSON`);
                                                return episodes;
                                            }
                                        }
                                    }
                                } catch (e2) {
                                    // Not valid JSON, continue
                                }
                            }
                        }
                    }
                } catch (e) {
                    log(`⚠️ Error parsing script tag ${i + 1}:`, e);
                }
            }
        } catch (e) {
            log(`❌ Error in JSON extraction strategy:`, e);
        }

        // Strategy 2: Try multiple HTML selectors to find episode lists
        // Prioritize selectors that are more likely to be episode cards
        const episodeSelectors = [
            // Most specific first
            '[class*="episode-card"]',
            '[class*="EpisodeCard"]',
            '[class*="episode-item"]',
            '[class*="EpisodeItem"]',
            '[class*="season"] [class*="episode"]',
            '[class*="Season"] [class*="Episode"]',
            // Then more general
            '[class*="episode"]',
            '[class*="Episode"]',
            '[data-episode]',
            '[data-episode-number]',
            // Card-based selectors (Hoichoi likely uses cards)
            '[class*="card"][class*="episode"]',
            '[class*="Card"][class*="Episode"]',
            '[class*="card"]',
            '[class*="Card"]',
            // List items
            'li[class*="episode"]',
            'li[class*="Episode"]',
            '[class*="item"][class*="episode"]',
            '[class*="Item"][class*="Episode"]',
            // Links
            'a[href*="/episode"]',
            'a[href*="/watch"]',
            // Container-based
            '[class*="episode-list"]',
            '[class*="EpisodeList"]',
            '[class*="episodes"]',
            '[class*="Episodes"]',
            // Generic divs with episode class
            'div[class*="episode"]',
            'div[class*="Episode"]'
        ];

        let episodeElements = [];
        for (const selector of episodeSelectors) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length > 0) {
                log(`Found ${elements.length} elements with selector: ${selector}`);
                episodeElements = Array.from(elements);
                // Only break if we found a reasonable number (not too many false positives)
                // For episode cards, expect 1-50 episodes typically
                if (episodeElements.length > 0 && episodeElements.length < 100) {
                    log(`Using selector: ${selector} (found ${episodeElements.length} elements)`);
                    break;
                }
            }
        }
        
        // If we found too many elements, try to filter to only episode-like ones
        if (episodeElements.length > 50) {
            log(`Too many elements found (${episodeElements.length}), filtering...`);
            episodeElements = episodeElements.filter(el => {
                const text = el.textContent || '';
                // Must contain episode-like patterns
                return text.match(/S\d+\s*E\d+|Episode\s*\d+|Ep\s*\d+|\d+m/i);
            });
            log(`After filtering: ${episodeElements.length} elements`);
        }

        // Strategy 3: If no specific episode elements found, try to find numbered items
        if (episodeElements.length === 0) {
            // Look for elements with episode numbers in text or data attributes
            const allLinks = doc.querySelectorAll('a[href*="episode"], a[href*="watch"], [class*="episode"], [class*="Episode"]');
            episodeElements = Array.from(allLinks);
            log(`Found ${episodeElements.length} potential episode links`);
        }

        // Strategy 4: Look for numbered list items or divs that might be episodes
        if (episodeElements.length === 0) {
            // Look for patterns like "Episode 1", "Ep 1", "1.", etc.
            const allElements = doc.querySelectorAll('div, li, a, span');
            for (const el of allElements) {
                const text = el.textContent || '';
                if (text.match(/[Ee]pisode\s+\d+|Ep\s+\d+|\d+[\.\)]\s+[A-Z]/i) && text.length < 200) {
                    episodeElements.push(el);
                }
            }
            log(`Found ${episodeElements.length} elements with episode-like patterns`);
        }

        // Extract episode information with improved parsing
        episodeElements.forEach((element, index) => {
            try {
                // Get all text content from the element and its children
                const fullText = element.textContent || '';
                const innerHTML = element.innerHTML || '';
                
                // Strategy 1: Extract episode number from "S1 E1", "S1E1", "E1", "Episode 1" patterns
                let episodeNumber = index + 1;
                
                // Check for "S1 E1" or "S1E1" format (most common on Hoichoi)
                const s1e1Match = fullText.match(/S\d+\s*E(\d+)|S\d+E(\d+)/i);
                if (s1e1Match) {
                    episodeNumber = parseInt(s1e1Match[1] || s1e1Match[2]);
                } else {
                    // Check data attributes
                    const dataEp = element.getAttribute('data-episode') || 
                                   element.getAttribute('data-episode-number') ||
                                   element.getAttribute('data-ep') ||
                                   element.closest('[data-episode]')?.getAttribute('data-episode');
                    if (dataEp) {
                        const epNum = parseInt(dataEp);
                        if (!isNaN(epNum) && epNum > 0) episodeNumber = epNum;
                    } else {
                        // Check text content for episode numbers
                        const epMatch = fullText.match(/[Ee]pisode\s*(\d+)|Ep\s*(\d+)|E\s*(\d+)|^(\d+)[\.\)]/);
                        if (epMatch) {
                            const epNum = parseInt(epMatch[1] || epMatch[2] || epMatch[3] || epMatch[4]);
                            if (!isNaN(epNum) && epNum > 0) episodeNumber = epNum;
                        }
                    }
                }

                // Strategy 2: Extract episode title - look for title elements or text that looks like a title
                let name = '';
                
                // Try multiple selectors for title
                const titleSelectors = [
                    '[class*="title"]',
                    '[class*="Title"]',
                    '[class*="name"]',
                    '[class*="Name"]',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    '[class*="episode-title"]',
                    '[class*="episode-name"]',
                    'a[href*="episode"]',
                    'a[href*="watch"]'
                ];
                
                let titleElement = null;
                for (const selector of titleSelectors) {
                    titleElement = element.querySelector(selector);
                    if (titleElement) {
                        const titleText = titleElement.textContent?.trim() || '';
                        // Make sure it's not just "Episode 1" or similar
                        if (titleText && !titleText.match(/^(Episode|Ep)\s*\d+$/i) && titleText.length > 3) {
                            name = titleText;
                            break;
                        }
                    }
                }
                
                // If no title found, try to extract from the element's text
                if (!name || name.length < 3) {
                    // Split text by newlines or common separators
                    const textLines = fullText.split(/\n|•|—|–/).map(l => l.trim()).filter(l => l.length > 0);
                    
                    // Look for a line that looks like a title (not episode number, not runtime, not description)
                    for (const line of textLines) {
                        // Skip if it's just episode number
                        if (line.match(/^(S\d+\s*E\d+|Episode\s*\d+|Ep\s*\d+|E\d+)$/i)) continue;
                        // Skip if it's runtime
                        if (line.match(/^\d+m$/i) || line.match(/^\d+\s*min/i)) continue;
                        // Skip if it's too short or too long
                        if (line.length < 3 || line.length > 100) continue;
                        // Skip if it contains common UI text
                        if (line.match(/^(Watch|Play|Stream|Subscribe|Download|Share)$/i)) continue;
                        
                        // This might be the title
                        name = line;
                        // Remove language suffix like "- Hindi", "- Bengali"
                        name = name.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu|Marathi|Gujarati|Punjabi|Kannada|Malayalam)$/i, '').trim();
                        break;
                    }
                }
                
                // Clean up title (remove episode number prefixes, language suffixes, etc.)
                if (name) {
                    name = name.replace(/^[Ee]pisode\s*\d+[:\s-]*/i, '').trim();
                    name = name.replace(/^Ep\s*\d+[:\s-]*/i, '').trim();
                    name = name.replace(/^S\d+\s*E\d+[:\s-]*/i, '').trim();
                    name = name.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu|Marathi|Gujarati|Punjabi|Kannada|Malayalam)$/i, '').trim();
                }
                
                if (!name || name.length < 2) {
                    name = `Episode ${episodeNumber}`;
                }

                // Strategy 3: Extract description/overview
                let overview = '';
                const descSelectors = [
                    '[class*="description"]',
                    '[class*="Description"]',
                    '[class*="overview"]',
                    '[class*="Overview"]',
                    '[class*="synopsis"]',
                    '[class*="Synopsis"]',
                    '[class*="summary"]',
                    '[class*="Summary"]',
                    'p',
                    '[class*="episode-description"]',
                    '[class*="episode-overview"]'
                ];
                
                for (const selector of descSelectors) {
                    const descElement = element.querySelector(selector);
                    if (descElement) {
                        const descText = descElement.textContent?.trim() || '';
                        // Look for description-like text (longer than title, shorter than 500 chars)
                        if (descText.length > 20 && descText.length < 500 && 
                            !descText.match(/^(S\d+\s*E\d+|Episode\s*\d+|Ep\s*\d+)$/i) &&
                            !descText.match(/^\d+m$/i) &&
                            descText !== name) {
                            overview = descText;
                            break;
                        }
                    }
                }
                
                // If no description found in specific elements, try to extract from full text
                if (!overview) {
                    const textLines = fullText.split(/\n|•|—|–/).map(l => l.trim()).filter(l => l.length > 0);
                    for (const line of textLines) {
                        // Skip episode number, title, runtime
                        if (line.match(/^(S\d+\s*E\d+|Episode\s*\d+|Ep\s*\d+|E\d+)$/i)) continue;
                        if (line === name) continue;
                        if (line.match(/^\d+m$/i) || line.match(/^\d+\s*min/i)) continue;
                        // Look for description-like text
                        if (line.length > 30 && line.length < 500 && 
                            !line.match(/^(Watch|Play|Stream|Subscribe|Download|Share)$/i)) {
                            overview = line;
                            break;
                        }
                    }
                }

                // Strategy 4: Extract runtime from "9m", "9 min", "9 minutes" format
                let runtime = null;
                const runtimePatterns = [
                    /(\d+)\s*m\b/i,  // "9m", "9 m"
                    /(\d+)\s*min/i,  // "9 min", "9 minutes"
                    /(\d+)\s*minutes?/i  // "9 minute", "9 minutes"
                ];
                
                for (const pattern of runtimePatterns) {
                    const runtimeMatch = fullText.match(pattern);
                    if (runtimeMatch) {
                        runtime = parseInt(runtimeMatch[1]);
                        break;
                    }
                }
                
                // Also check in specific runtime elements
                if (!runtime) {
                    const runtimeElement = element.querySelector('[class*="runtime"], [class*="duration"], [class*="time"], [class*="Runtime"], [class*="Duration"]');
                    if (runtimeElement) {
                        const runtimeText = runtimeElement.textContent || '';
                        for (const pattern of runtimePatterns) {
                            const runtimeMatch = runtimeText.match(pattern);
                            if (runtimeMatch) {
                                runtime = parseInt(runtimeMatch[1]);
                                break;
                            }
                        }
                    }
                }

                // Strategy 5: Extract air date (if available)
                let airDate = '';
                const dateElement = element.querySelector('[class*="date"], [class*="release"], [class*="Date"], [class*="Release"], time');
                if (dateElement) {
                    const dateText = dateElement.textContent || dateElement.getAttribute('datetime') || '';
                    // Try to parse date in various formats
                    const dateMatch = dateText.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
                    if (dateMatch) {
                        airDate = dateMatch[0];
                    }
                }

                // Only add episode if we have at least a valid episode number
                if (episodeNumber > 0) {
                    const episodeData = {
                        episodeNumber: episodeNumber,
                        name: name,
                        overview: overview,
                        airDate: airDate,
                        runtime: runtime || 0,
                        isHoichoiOnly: true,
                        descriptionSource: 'Hoichoi'
                    };
                    
                    episodes.push(episodeData);
                    
                    log(`✅ Parsed Episode ${episodeNumber}:`);
                    log(`   Title: "${name}"`);
                    log(`   Runtime: ${runtime || 0} minutes`);
                    log(`   Description: ${overview.length} characters`);
                    log(`   Full element text sample: ${fullText.substring(0, 200)}`);
                } else {
                    log(`⚠️ Skipped element ${index}: Could not determine episode number`);
                    log(`   Element text: ${fullText.substring(0, 200)}`);
                }

            } catch (error) {
                log(`Error parsing episode element ${index}:`, error);
            }
        });

        // If still no episodes found, try to extract from URL patterns or create placeholder episodes
        if (episodes.length === 0) {
            log('⚠️ No episodes found with standard methods. Trying fallback strategies...');
            
            // Strategy 5: Look for episode URLs in the HTML
            const episodeUrlPattern = /\/episode[s]?\/?(\d+)|episode[_-]?(\d+)/gi;
            const urlMatches = html.match(episodeUrlPattern);
            if (urlMatches && urlMatches.length > 0) {
                log(`Found ${urlMatches.length} episode URL patterns`);
                const episodeNumbers = new Set();
                urlMatches.forEach(match => {
                    const numMatch = match.match(/\d+/);
                    if (numMatch) {
                        episodeNumbers.add(parseInt(numMatch[0]));
                    }
                });
                Array.from(episodeNumbers).sort((a, b) => a - b).forEach(epNum => {
                    episodes.push({
                        episodeNumber: epNum,
                        name: `Episode ${epNum}`,
                        overview: '',
                        airDate: '',
                        runtime: 0,
                        isHoichoiOnly: true,
                        descriptionSource: 'Hoichoi'
                    });
                });
            }

            // Strategy 6: Look for numbered content sections that might be episodes
            if (episodes.length === 0) {
                const numberedSections = doc.querySelectorAll('[class*="1"], [class*="2"], [class*="3"], [id*="1"], [id*="2"], [id*="3"]');
                log(`Found ${numberedSections.length} numbered sections`);
                // This is a last resort - create episodes based on common patterns
                // Look for repeated structures that might indicate episodes
                const repeatedStructures = {};
                numberedSections.forEach(el => {
                    const classList = Array.from(el.classList || []);
                    const id = el.id || '';
                    const key = classList.join(' ') + id;
                    if (!repeatedStructures[key]) {
                        repeatedStructures[key] = [];
                    }
                    repeatedStructures[key].push(el);
                });
                
                // Find the most common structure (likely episodes)
                let maxCount = 0;
                let episodeStructure = null;
                for (const key in repeatedStructures) {
                    if (repeatedStructures[key].length > maxCount && repeatedStructures[key].length >= 2) {
                        maxCount = repeatedStructures[key].length;
                        episodeStructure = repeatedStructures[key];
                    }
                }
                
                if (episodeStructure && episodeStructure.length >= 2 && episodeStructure.length <= 50) {
                    log(`Found ${episodeStructure.length} repeated structures, treating as episodes`);
                    episodeStructure.forEach((el, idx) => {
                        const titleEl = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"]') || el;
                        const title = titleEl.textContent.trim() || `Episode ${idx + 1}`;
                        episodes.push({
                            episodeNumber: idx + 1,
                            name: title,
                            overview: '',
                            airDate: '',
                            runtime: 0,
                            isHoichoiOnly: true,
                            descriptionSource: 'Hoichoi'
                        });
                    });
                }
            }
        }

        // Sort episodes by episode number
        episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

        // Remove duplicates (same episode number)
        const uniqueEpisodes = [];
        const seenNumbers = new Set();
        episodes.forEach(ep => {
            if (!seenNumbers.has(ep.episodeNumber)) {
                seenNumbers.add(ep.episodeNumber);
                uniqueEpisodes.push(ep);
            }
        });

        log(`Parsed ${uniqueEpisodes.length} unique episodes from Hoichoi`);
        
        // Strategy 7: If still no episodes, try direct text pattern matching from HTML
        if (uniqueEpisodes.length === 0) {
            log('⚠️ No episodes found with DOM parsing. Trying direct text pattern matching...');
            
            // Look for patterns like "S1 E1", "Episode 1", etc. followed by titles
            const episodePatterns = [
                /S\d+\s*E(\d+)[^<]*?([A-Z][^<]{10,100})/gi,
                /Episode\s+(\d+)[^<]*?([A-Z][^<]{10,100})/gi,
                /Ep\s+(\d+)[^<]*?([A-Z][^<]{10,100})/gi
            ];
            
            for (const pattern of episodePatterns) {
                const matches = [...html.matchAll(pattern)];
                if (matches.length > 0) {
                    log(`Found ${matches.length} potential episodes with pattern: ${pattern}`);
                    matches.forEach((match, idx) => {
                        const epNum = parseInt(match[1]);
                        const title = match[2]?.trim() || `Episode ${epNum}`;
                        if (epNum > 0 && epNum <= 100) {
                            episodes.push({
                                episodeNumber: epNum,
                                name: title.replace(/\s*-\s*(Hindi|Bengali|English|Tamil|Telugu)$/i, '').trim(),
                                overview: '',
                                airDate: '',
                                runtime: 0,
                                isHoichoiOnly: true,
                                descriptionSource: 'Hoichoi'
                            });
                        }
                    });
                    if (episodes.length > 0) break;
                }
            }
            
            // Update unique episodes after pattern matching
            uniqueEpisodes = [];
            const seenNumbers = new Set();
            episodes.forEach(ep => {
                if (!seenNumbers.has(ep.episodeNumber)) {
                    seenNumbers.add(ep.episodeNumber);
                    uniqueEpisodes.push(ep);
                }
            });
        }
        
        // Debug: Log HTML structure if no episodes found
        if (uniqueEpisodes.length === 0) {
            log('⚠️ DEBUG: No episodes found. HTML structure analysis:');
            log(`- Total script tags: ${doc.querySelectorAll('script').length}`);
            log(`- Total links: ${doc.querySelectorAll('a').length}`);
            log(`- Total divs: ${doc.querySelectorAll('div').length}`);
            log(`- Page title: ${doc.querySelector('title')?.textContent || 'N/A'}`);
            
            // Check for common episode-related text
            const htmlLower = html.toLowerCase();
            log(`- Contains "episode": ${htmlLower.includes('episode')}`);
            log(`- Contains "s1 e1": ${htmlLower.includes('s1 e1') || htmlLower.includes('s1e1')}`);
            log(`- Contains "season": ${htmlLower.includes('season')}`);
            log(`- Contains "9m" or runtime: ${htmlLower.match(/\d+m/)}`);
            
            // Log a sample of the HTML for debugging (first 3000 chars)
            log(`- HTML sample: ${html.substring(0, 3000)}`);
        } else {
            log(`✅ Successfully extracted ${uniqueEpisodes.length} episodes`);
            uniqueEpisodes.forEach(ep => {
                log(`   Ep ${ep.episodeNumber}: "${ep.name}" (${ep.runtime}m)`);
            });
        }
        
        return uniqueEpisodes;
    }

    // Convert Hoichoi scraped data to TMDB-compatible format
    function convertHoichoiToTvdbFormat(scrapedData, url) {
        // Map Hoichoi language to ISO code
        const langMap = {
            'hi': 'hi', // Hindi
            'bn': 'bn', // Bengali
            'en': 'en', // English
            'ta': 'ta', // Tamil
            'te': 'te'  // Telugu
        };

        const originalLanguage = langMap[scrapedData.language] || 'bn';

        // Parse genres - convert to array format
        let genres = [];
        if (Array.isArray(scrapedData.genres)) {
            genres = scrapedData.genres;
        } else if (typeof scrapedData.genres === 'string') {
            genres = scrapedData.genres.split('|').map(g => g.trim()).filter(Boolean);
        }

        return {
            name: scrapedData.title || '',
            originalName: scrapedData.title || '',
            overview: scrapedData.description || '',
            year: scrapedData.year || '',
            originalLanguage: originalLanguage,
            genres: genres,
            status: 'Ended', // Default, can be updated if we find status info
            originCountry: ['IN'], // India (Hoichoi is Indian platform)
            imdbId: null,
            homepage: url,
            runtime: null,
            rating: null,
            isHoichoiOnly: true,
            posterUrl: scrapedData.posterUrl || ''
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
            log(`🔍 Detected original language: ${data.originalLanguage}`);
            const tvdbLanguage = LANGUAGE_MAP[data.originalLanguage];
            log(`🔍 Mapped to TVDB language: ${tvdbLanguage}`);
            
            if (tvdbLanguage) {
                const langSelect = document.querySelector('select[name="language"]') ||
                                 document.querySelector('select[id*="language"]') ||
                                 document.querySelector('select[placeholder*="language"]') ||
                                 document.querySelector('select:has(option[value*="hin"])') ||
                                 document.querySelector('select:has(option:contains("Hindi"))');
                if (langSelect) {
                    log(`🔍 Found language select with ${langSelect.options.length} options`);
                    log(`🔍 Select element: ${langSelect.tagName} name="${langSelect.name}" id="${langSelect.id}"`);
                    
                    // Log all available options for debugging
                    Array.from(langSelect.options).forEach((opt, index) => {
                        const isSelected = opt.selected ? ' (SELECTED)' : '';
                        log(`  Option ${index}: value="${opt.value}" text="${opt.textContent}"${isSelected}`);
                    });
                    
                    const option = Array.from(langSelect.options).find(opt => {
                        // Try exact value match first (most reliable)
                        if (opt.value === tvdbLanguage) {
                            log(`✅ Exact value match: ${opt.value} = ${tvdbLanguage}`);
                            return true;
                        }
                        
                        // Special handling for specific languages to avoid false matches
                        if (tvdbLanguage === 'hin') {
                            // For Hindi, only match if text contains "Hindi" (not "Chinese")
                            if (opt.textContent.toLowerCase().includes('hindi') && 
                                !opt.textContent.toLowerCase().includes('chinese')) {
                                log(`✅ Hindi text match: "${opt.textContent}" contains "hindi"`);
                                return true;
                            }
                            return false;
                        }
                        
                        if (tvdbLanguage === 'chi') {
                            // For Chinese, only match if text contains "Chinese" (not "Hindi")
                            if (opt.textContent.toLowerCase().includes('chinese') && 
                                !opt.textContent.toLowerCase().includes('hindi')) {
                                log(`✅ Chinese text match: "${opt.textContent}" contains "chinese"`);
                                return true;
                            }
                            return false;
                        }
                        
                        // For other languages, try exact value match only
                        if (opt.value === tvdbLanguage) {
                            log(`✅ Exact value match: ${opt.value} = ${tvdbLanguage}`);
                            return true;
                        }
                        
                        return false;
                    });
                    if (option) {
                        option.selected = true;
                        langSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                        log(`✅ Language filled: ${data.originalLanguage} -> ${tvdbLanguage} (${option.textContent})`);
                    } else {
                        log(`❌ Language option not found for: ${tvdbLanguage}`);
                        log(`🔍 Available values: ${Array.from(langSelect.options).map(opt => opt.value).join(', ')}`);
                        
                        // Fallback: Try to find Hindi by searching for "hindi" in text content
                        if (data.originalLanguage === 'hi') {
                            log(`🔄 Fallback: Searching for Hindi option...`);
                            const hindiOption = Array.from(langSelect.options).find(opt => 
                                opt.textContent.toLowerCase().includes('hindi') &&
                                !opt.textContent.toLowerCase().includes('chinese')
                            );
                            if (hindiOption) {
                                hindiOption.selected = true;
                                langSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                filledCount++;
                                log(`✅ Fallback Hindi found: ${hindiOption.textContent}`);
                            } else {
                                log(`❌ No Hindi option found even with fallback`);
                            }
                        }
                    }
                } else {
                    log('❌ Language select not found');
                }
            } else {
                log(`❌ No TVDB mapping for language: ${data.originalLanguage}`);
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
            
            // Try multiple selectors for genre checkboxes - be more aggressive
            let genreCheckboxes = document.querySelectorAll('input[type="checkbox"][name*="genre"], input[type="checkbox"][name*="Genre"], input[type="checkbox"][id*="genre"], input[type="checkbox"][id*="Genre"]');
            
            // If no genre-specific checkboxes found, try to find all checkboxes and filter by context
            if (genreCheckboxes.length === 0) {
                log('No genre-specific checkboxes found, searching all checkboxes...');
                const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
                log(`Found ${allCheckboxes.length} total checkboxes`);
                
                // Look for checkboxes that are near genre-related text
                const genreSection = document.querySelector('[class*="genre"], [id*="genre"], label:contains("Genre"), label:contains("genre")')?.closest('div, section, form') || document.body;
                genreCheckboxes = genreSection.querySelectorAll('input[type="checkbox"]');
                log(`Found ${genreCheckboxes.length} checkboxes in genre section`);
                
                // If still none, try to find checkboxes with common genre names in their labels
                if (genreCheckboxes.length === 0) {
                    const genreNames = ['Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror', 'Sci-Fi', 'Fantasy'];
                    genreCheckboxes = Array.from(allCheckboxes).filter(cb => {
                        const label = cb.nextElementSibling?.textContent || cb.parentElement?.textContent || cb.closest('label')?.textContent || '';
                        return genreNames.some(name => label.toLowerCase().includes(name.toLowerCase()));
                    });
                    log(`Found ${genreCheckboxes.length} checkboxes by genre name matching`);
                }
            } else {
                log(`Found ${genreCheckboxes.length} genre checkboxes using specific selectors`);
            }

            // Log all found checkboxes for debugging
            if (genreCheckboxes.length > 0) {
                log('Available genre checkboxes:');
                Array.from(genreCheckboxes).forEach((cb, index) => {
                    const label = cb.nextElementSibling?.textContent || cb.parentElement?.textContent || cb.closest('label')?.textContent || '';
                    const value = cb.value || '';
                    const name = cb.name || '';
                    log(`  Checkbox ${index}: value="${value}", name="${name}", label="${label.trim().substring(0, 50)}"`);
                });
            }

            // Clear existing selections
            genreCheckboxes.forEach(cb => {
                cb.checked = false;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            });

            // Select mapped genres
            let genresSelected = 0;
            data.genres.forEach(genre => {
                const genreName = (genre.name || genre).toString().trim();
                const tvdbGenre = GENRE_MAP[genreName];
                log(`Mapping genre: "${genreName}" -> "${tvdbGenre || 'NO MAPPING'}"`);
                
                if (tvdbGenre) {
                    // Try multiple matching strategies
                    const checkbox = Array.from(genreCheckboxes).find(cb => {
                        const label = (cb.nextElementSibling?.textContent || cb.parentElement?.textContent || cb.closest('label')?.textContent || '').toLowerCase().trim();
                        const value = (cb.value || '').toLowerCase().trim();
                        const name = (cb.name || '').toLowerCase().trim();
                        const tvdbLower = tvdbGenre.toLowerCase();
                        const genreLower = genreName.toLowerCase();
                        
                        // Strategy 1: Exact value match
                        if (value === tvdbLower || value === genreLower) {
                            log(`  ✓ Exact value match: "${value}"`);
                            return true;
                        }
                        
                        // Strategy 2: Label contains TVDB genre name
                        if (label.includes(tvdbLower)) {
                            log(`  ✓ Label contains TVDB genre: "${label.substring(0, 50)}"`);
                            return true;
                        }
                        
                        // Strategy 3: Label contains original genre name
                        if (label.includes(genreLower)) {
                            log(`  ✓ Label contains original genre: "${label.substring(0, 50)}"`);
                            return true;
                        }
                        
                        // Strategy 4: Special handling for common genres
                        const genreVariations = {
                            'action': ['action', 'adventure'],
                            'comedy': ['comedy', 'comic'],
                            'drama': ['drama', 'dramatic'],
                            'romance': ['romance', 'romantic', 'love'],
                            'thriller': ['thriller', 'suspense'],
                            'horror': ['horror', 'scary'],
                            'science fiction': ['sci-fi', 'science fiction', 'scifi', 'sf'],
                            'fantasy': ['fantasy', 'magic']
                        };
                        
                        for (const [key, variations] of Object.entries(genreVariations)) {
                            if (tvdbLower.includes(key) || genreLower.includes(key)) {
                                if (variations.some(v => label.includes(v))) {
                                    log(`  ✓ Genre variation match: "${label.substring(0, 50)}"`);
                                    return true;
                                }
                            }
                        }
                        
                        return false;
                    });
                    
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        checkbox.dispatchEvent(new Event('click', { bubbles: true }));
                        const labelText = checkbox.nextElementSibling?.textContent || checkbox.parentElement?.textContent || checkbox.closest('label')?.textContent || '';
                        log(`✅ Selected genre: ${tvdbGenre} (checkbox label: "${labelText.trim().substring(0, 50)}")`);
                        genresSelected++;
                        filledCount++;
                    } else {
                        log(`❌ Genre checkbox not found for: ${tvdbGenre} (from "${genreName}")`);
                        log(`   Tried matching: value="${tvdbGenre}", label contains "${tvdbGenre.toLowerCase()}" or "${genreName.toLowerCase()}"`);
                    }
                } else {
                    log(`⚠️ No mapping found for genre: "${genreName}"`);
                    // Try direct matching without mapping
                    const directMatch = Array.from(genreCheckboxes).find(cb => {
                        const label = (cb.nextElementSibling?.textContent || cb.parentElement?.textContent || cb.closest('label')?.textContent || '').toLowerCase();
                        return label.includes(genreName.toLowerCase());
                    });
                    if (directMatch) {
                        directMatch.checked = true;
                        directMatch.dispatchEvent(new Event('change', { bubbles: true }));
                        directMatch.dispatchEvent(new Event('click', { bubbles: true }));
                        log(`✅ Direct match found for genre: "${genreName}"`);
                        genresSelected++;
                        filledCount++;
                    }
                }
            });
            
            log(`Genre selection complete: ${genresSelected}/${data.genres.length} genres selected`);
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
    // EXACT copy from v1.5.0 - simple and working
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

    // Fixed: Exclude UI panel textareas from count to prevent "one less row" issue
    async function ensureRows(n) {
        const addBtn = Array.from(document.querySelectorAll('button')).find(b => 
            /add another/i.test(b.textContent || '')
        );
        
        // Count only episode form textareas, exclude UI panel textareas
        // This fixes the issue where UI panel textarea (tvdb-manual-episode-data) 
        // was being counted, causing one less row to be created
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        const episodeTextareas = allTextareas.filter(ta => {
            // Exclude textareas inside the UI panel
            const panel = ta.closest('#tvdb-helper-panel');
            return !panel; // Only count textareas NOT in the UI panel
        });
        const have = episodeTextareas.length;
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
            } else if (translationSource === 'hoichoi') {
                // Use already-fetched Hoichoi data
                if (window.tvdbFetchedData && window.tvdbFetchedData.tmdb && window.tvdbFetchedData.tmdb.isHoichoiOnly) {
                    const hoichoiData = window.tvdbFetchedData.tmdb;
                    log(`Using Hoichoi data: name="${hoichoiData.name}", overview="${hoichoiData.overview ? hoichoiData.overview.substring(0, 50) + '...' : 'None'}"`);
                    fillTranslationFields(hoichoiData.name || hoichoiData.originalName, hoichoiData.overview);
                    updateStatus('⚠️ Hoichoi data applied (original language). For English, use TMDB or OMDb source.');
                } else {
                    log('❌ No Hoichoi data available');
                    updateStatus('No Hoichoi data available. Please fetch Hoichoi data in Step 1/2 first, or use TMDB/OMDb for English translations.');
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
        
        // Check if we're already processing this step to prevent loops
        if (window.tvdbProcessingStep === step) {
            log(`⚠️ Already processing step ${step}, skipping to prevent loop`);
            updateStatus(`Already processing step ${step}, please wait...`);
            return;
        }
        
        // Mark this step as being processed
        window.tvdbProcessingStep = step;
        
        // Apply the step first
        try {
            applyStep(step);
            log(`✅ Step ${step} applied successfully`);
        } catch (error) {
            log(`❌ Error applying step ${step}:`, error);
            updateStatus(`Error applying step: ${error.message}`);
            window.tvdbProcessingStep = null; // Clear processing flag
            return;
        }

        // Wait for form validation to complete before clicking Continue
        setTimeout(() => {
            log('🔍 Looking for Continue button...');
            const continueBtn = findContinueButton();
            if (continueBtn) {
                log(`✅ Found Continue button: ${continueBtn.textContent || continueBtn.value}`);
                log('🖱️ Clicking page Continue button');
                
                try {
                    continueBtn.click();
                    updateStatus('Form filled and Continue button clicked!');
                    log('✅ Continue button clicked successfully');
                    
                    // Clear processing flag after successful click
                    setTimeout(() => {
                        window.tvdbProcessingStep = null;
                        log('🔄 Processing flag cleared');
                    }, 2000);
                    
                } catch (error) {
                    log('❌ Error clicking Continue button:', error);
                    updateStatus('Error clicking Continue button. Please click manually.');
                    window.tvdbProcessingStep = null; // Clear processing flag on error
                }
            } else {
                updateStatus('Form filled, but Continue button not found. Please click Continue manually.');
                log('❌ Continue button not found on page');
                window.tvdbProcessingStep = null; // Clear processing flag
            }
        }, 500);
    }
    

    // Find the page's Continue button
    function findContinueButton() {
        log('🔍 Looking for Continue button...');
        
        const currentStep = getCurrentStep();
        
        // For Step 2 and Step 5, look specifically for "Save" button
        if (currentStep === 'step2' || currentStep === 'step5') {
            log(`🔍 ${currentStep} detected - looking for "Save" button...`);
            
            // First try to find by text content
            const saveBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent && btn.textContent.toLowerCase().includes('save')
            );
            
            if (saveBtn) {
                log(`✅ Found Save button: "${saveBtn.textContent}"`);
                log(`🔍 Save button details: type="${saveBtn.type}" class="${saveBtn.className}"`);
                return saveBtn;
            } else {
                log('❌ Save button not found');
                // Log all available buttons for debugging
                const allButtons = document.querySelectorAll('button');
                log(`🔍 Available buttons on ${currentStep} (${allButtons.length} total):`);
                allButtons.forEach((btn, index) => {
                    const text = btn.textContent || btn.value || '';
                    const type = btn.type || 'button';
                    log(`  Button ${index}: "${text}" (type: ${type})`);
                });
            }
        }
        
        // For Step 3, look specifically for "Add Episodes" button
        if (currentStep === 'step3') {
            log('🔍 Step 3 detected - looking for "Add Episodes" button...');
            
            // Try multiple selectors for Add Episodes button
            const selectors = [
                'button[type="submit"]',
                'button.btn-primary',
                'button.btn-success',
                'button:contains("Add Episodes")',
                'button'
            ];
            
            let addEpisodesBtn = null;
            
            for (const selector of selectors) {
                const buttons = document.querySelectorAll(selector);
                log(`🔍 Checking selector "${selector}": found ${buttons.length} elements`);
                
                addEpisodesBtn = Array.from(buttons).find(btn => 
                    btn.textContent && btn.textContent.trim() === 'Add Episodes'
                );
                
                if (addEpisodesBtn) {
                    log(`✅ Found Add Episodes button with selector "${selector}": "${addEpisodesBtn.textContent}"`);
                    break;
                }
            }
            
            if (addEpisodesBtn) {
                log(`🔍 Button details: type="${addEpisodesBtn.type}" class="${addEpisodesBtn.className}"`);
                return addEpisodesBtn;
            } else {
                log('❌ Add Episodes button not found with exact match, trying partial match...');
                
                // Try partial match as fallback
                const partialMatchBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                    btn.textContent && btn.textContent.toLowerCase().includes('add episodes')
                );
                
                if (partialMatchBtn) {
                    log(`✅ Found Add Episodes button (partial match): "${partialMatchBtn.textContent}"`);
                    return partialMatchBtn;
                }
                
                // Log all available buttons for debugging
                const allButtons = document.querySelectorAll('button');
                log(`🔍 Available buttons on Step 3 (${allButtons.length} total):`);
                allButtons.forEach((btn, index) => {
                    const text = btn.textContent || btn.value || '';
                    const type = btn.type || 'button';
                    log(`  Button ${index}: "${text}" (type: ${type})`);
                });
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

            // Focus the field
            field.focus();
            
            // Clear existing value
            field.value = '';
            field.setAttribute('value', '');
            
            // Set the new value
            field.value = value;
            field.setAttribute('value', value);
            
            // Trigger events
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('blur', { bubbles: true }));
            
            log(`✓ Field filled with: ${value}`);
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

        // For Hoichoi, we don't need TMDB/IMDb ID - we use already-fetched data
        if (translationSource !== 'hoichoi' && !tmdbId && !imdbId) {
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
            } else if (translationSource === 'hoichoi') {
                // Fetch or use Hoichoi data
                const hoichoiUrl = document.getElementById('tvdb-hoichoi-url-step5')?.value.trim() || window.tvdbFetchedData?.officialSite || '';
                
                if (hoichoiUrl) {
                    // Fetch fresh data from Hoichoi URL
                    updateStatus('Fetching data from Hoichoi...');
                    try {
                        const tvdbData = await fetchHoichoiShow(hoichoiUrl);
                        translationData = {
                            name: tvdbData.name || tvdbData.originalName || '',
                            overview: tvdbData.overview || '',
                            source: 'Hoichoi (Original Language)'
                        };
                        
                        // Store the fetched data
                        window.tvdbFetchedData = window.tvdbFetchedData || {};
                        window.tvdbFetchedData.tmdb = tvdbData;
                        window.tvdbFetchedData.officialSite = hoichoiUrl;
                        window.tvdbFetchedData.tmdb.isHoichoiOnly = true;
                        
                        // Update context
                        context.originalIso1 = tvdbData.originalLanguage;
                        
                        // Update translation data display
                        updateTranslationData();
                        
                        log(`Fetched Hoichoi data: ${translationData.name}`);
                        updateStatus('⚠️ Hoichoi data fetched (original language). For English translation, use TMDB or OMDb source.');
                    } catch (error) {
                        log('Error fetching Hoichoi data:', error);
                        updateStatus(`Error fetching Hoichoi data: ${error.message}`);
                        return;
                    }
                } else if (window.tvdbFetchedData && window.tvdbFetchedData.tmdb && window.tvdbFetchedData.tmdb.isHoichoiOnly) {
                    // Use already-fetched Hoichoi data
                    const hoichoiData = window.tvdbFetchedData.tmdb;
                    translationData = {
                        name: hoichoiData.name || hoichoiData.originalName || '',
                        overview: hoichoiData.overview || '',
                        source: 'Hoichoi (Original Language)'
                    };
                    log(`Using existing Hoichoi data: ${translationData.name}`);
                    updateStatus('⚠️ Hoichoi data is in original language. For English translation, please use TMDB or OMDb source.');
                } else {
                    updateStatus('Please enter a Hoichoi URL or fetch Hoichoi data in Step 1/2 first. For English translations, use TMDB/OMDb.');
                    return;
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

    
        // Expose show panel function globally
        window.tvdbShowPanel = () => {
            createUI();
            log('TVDB Helper panel shown');
        };

        // Expose reset function globally for debugging
        window.tvdbReset = () => {
            window.tvdbProcessingStep = null;
            log('🔄 TVDB processing flag reset');
        };


    // Expose global function for manual testing
    window.tvdbHelperForceShow = function() {
        console.log('🔧 Manual force show called');
        forceShowPanel();
    };
    
    window.tvdbHelperTest = function() {
        console.log('🧪 TVDB Helper Test Function');
        console.log('Script version: 1.8.0');
        console.log('Current step:', getCurrentStep());
        console.log('Document ready:', document.readyState);
        console.log('Body exists:', !!document.body);
        console.log('UI exists:', !!document.getElementById('tvdb-helper-ui'));
        console.log('Toggle exists:', !!document.getElementById('tvdb-helper-toggle'));
        forceShowPanel();
    };
    
    // Create immediate test indicator
    function createTestIndicator() {
        try {
            if (!document.body) {
                setTimeout(createTestIndicator, 100);
                return;
            }
            
            // Remove existing indicator if any
            const existing = document.getElementById('tvdb-helper-test-indicator');
            if (existing) {
                existing.remove();
            }
            
            const testDiv = document.createElement('div');
            testDiv.id = 'tvdb-helper-test-indicator';
            testDiv.style.cssText = 'position: fixed; top: 10px; left: 10px; background: #ff6b6b; color: white; padding: 10px; border-radius: 4px; z-index: 999999; font-size: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;';
            testDiv.textContent = '🎬 TVDB Helper Loaded - Press Ctrl+Shift+T';
            testDiv.title = 'Click to show UI';
            testDiv.onclick = function() {
                try {
                    if (typeof forceShowPanel === 'function') {
                        forceShowPanel();
                    } else {
                        console.log('forceShowPanel not available yet, calling init...');
                        init();
                    }
                } catch (e) {
                    console.error('Error in test indicator click:', e);
                }
            };
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (testDiv.parentNode) {
                    testDiv.style.opacity = '0.5';
                }
            }, 5000);
            
            document.body.appendChild(testDiv);
            log('Test indicator created successfully');
        } catch (error) {
            console.error('Error creating test indicator:', error);
        }
    }
    
    // Create test indicator after a short delay to ensure functions are defined
    setTimeout(createTestIndicator, 200);

    // Start the script
    waitForPage();

})();
