// API Configuration
const CONFIG = {
    // Google Safe Browsing API
    SAFE_BROWSING_API_URL: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',
    SAFE_BROWSING_API_KEY: 'YOUR_API_KEY', // Replace with your actual API key
    
    // PhishTank API for additional verification (optional)
    PHISHTANK_API_URL: 'https://checkurl.phishtank.com/checkurl/',
    
    // Detection thresholds
    URL_ANALYSIS_THRESHOLD: 0.6,  // Higher threshold to reduce false positives
    CONTENT_ANALYSIS_THRESHOLD: 0.8,
    
    // Features Configuration
    FEATURES: {
        urlAnalysis: true,
        contentScanning: false,  // Disable by default to reduce false positives
        securityScore: true,
        safeHistory: true,
        whitelist: true,
        feedback: true
    },
    
    // Default settings
    DEFAULT_SETTINGS: {
        sensitivity: 'medium',  // low, medium, high
        showNotifications: true,
        autoBlock: false,  // Don't auto-block by default
        scanEmails: false   // Email scanning disabled by default
    }
};

export default CONFIG;
