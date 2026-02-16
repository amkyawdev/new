// config/env.js
export const ENV = {
    // Gemini AI API Configuration
    GEMINI_API_KEY: "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",
    GEMINI_MODEL: "gemini-pro", // or "gemini-pro-vision" for image support
    GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models",
    
    // App Configuration
    APP_NAME: "Burme AI",
    APP_VERSION: "1.0.0",
    APP_DESCRIPTION: "Next Generation AI-Powered Code Editor",
    
    // API Endpoints
    API_BASE_URL: window.location.origin,
    
    // Feature Flags
    ENABLE_AI_CHAT: true,
    ENABLE_VOICE_INPUT: false, // Coming soon
    ENABLE_COLLABORATION: false, // Coming soon
    
    // Editor Settings
    DEFAULT_THEME: "dark",
    DEFAULT_FONT_SIZE: 14,
    DEFAULT_TAB_SIZE: 4,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    
    // File Settings
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: [
        'html', 'css', 'js', 'json', 'md', 'txt',
        'jsx', 'ts', 'tsx', 'vue', 'php', 'py',
        'rb', 'java', 'c', 'cpp', 'go', 'rs'
    ],
    
    // Storage Keys
    STORAGE_KEYS: {
        THEME: 'burme-theme',
        USER: 'burme-user',
        PROJECTS: 'burme-projects',
        SETTINGS: 'burme-settings'
    },
    
    // Firebase Collections
    FIRESTORE_COLLECTIONS: {
        USERS: 'users',
        PROJECTS: 'projects',
        SETTINGS: 'settings',
        ANALYTICS: 'analytics'
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK: 'Network error. Please check your connection.',
        AUTH: 'Authentication failed. Please sign in again.',
        PERMISSION: 'You don\'t have permission to perform this action.',
        NOT_FOUND: 'The requested resource was not found.',
        SERVER: 'Server error. Please try again later.',
        AI_SERVICE: 'AI service unavailable. Please try again.',
        FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
        INVALID_FILE_TYPE: 'File type not supported.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        SAVED: 'Project saved successfully!',
        DELETED: 'Project deleted successfully!',
        CREATED: 'Project created successfully!',
        UPLOADED: 'File uploaded successfully!',
        DOWNLOADED: 'Project downloaded successfully!',
        SHARED: 'Project shared successfully!'
    },
    
    // API Rate Limiting
    RATE_LIMITS: {
        AI_REQUESTS: 60, // per minute
        FILE_UPLOADS: 10, // per hour
        PROJECT_CREATES: 20 // per day
    },
    
    // Cache Settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    
    // Debug Mode
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Feature Toggles
    FEATURES: {
        DARK_MODE: true,
        AI_ASSISTANT: true,
        LIVE_PREVIEW: true,
        FILE_TREE: true,
        AUTO_COMPLETE: true,
        SYNTAX_HIGHLIGHTING: true,
        MULTI_CURSOR: true,
        KEYBOARD_SHORTCUTS: true
    }
};

// Validate API key (for development)
if (ENV.DEBUG && !ENV.GEMINI_API_KEY) {
    console.warn('⚠️ Gemini API key is not set. AI features will not work.');
}

// Export individual constants for easier imports
export const {
    GEMINI_API_KEY,
    GEMINI_MODEL,
    APP_NAME,
    APP_VERSION,
    DEBUG,
    FEATURES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES
} = ENV;
