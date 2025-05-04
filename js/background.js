import CONFIG from './config.js';
import AIService from './services/aiService.js';
import ListService from './services/listService.js';
import SettingsService from './services/settingsService.js';
import FeedbackService from './services/feedbackService.js';

// Initialize stats
let stats = {
  scanned: 0,
  blocked: 0,
  threats: [],
  lastScan: null
};

// API health status
let apiHealth = {
  status: 'unknown',
  lastCheck: null
};

// Initialize from storage
chrome.storage.local.get(['stats', 'apiHealth'], (result) => {
  if (result.stats) {
    stats = result.stats;
  }
  if (result.apiHealth) {
    apiHealth = result.apiHealth;
  }
  
  // Initialize settings if not already set
  SettingsService.getSettings();
  
  // Check API health on startup
  checkAPIHealth();
});

// Check API health
async function checkAPIHealth() {
  try {
    const response = await fetch(`${CONFIG.SAFE_BROWSING_API_URL}?key=${CONFIG.SAFE_BROWSING_API_KEY}`, {
      method: 'HEAD'
    });
    
    apiHealth = {
      status: response.ok ? 'operational' : 'degraded',
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    apiHealth = {
      status: 'offline',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }
  
  chrome.storage.local.set({ apiHealth });
  
  // Schedule next health check (every 30 minutes)
  setTimeout(checkAPIHealth, 30 * 60 * 1000);
}

async function analyzeURL(url) {
  try {
    // Skip analysis for browser internal pages
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
        url.startsWith('about:') || url.startsWith('moz-extension://')) {
      return { safe: true, reason: 'browser-internal' };
    }
    
    // Get current settings
    const settings = await SettingsService.getSettings();
    
    // Check whitelist first
    if (await ListService.isWhitelisted(url)) {
      return { safe: true, reason: 'whitelisted' };
    }
    
    // Check blacklist
    if (await ListService.isBlacklisted(url)) {
      stats.blocked++;
      chrome.storage.local.set({ stats });
      return { 
        safe: false, 
        reason: 'blacklisted',
        securityScore: 0
      };
    }
    
    // Perform URL analysis
    const urlAnalysis = await AIService.analyzeURL(url);
    
    // Update stats
    stats.scanned++;
    stats.lastScan = new Date().toISOString();
    
    // If URL is flagged as unsafe
    if (!urlAnalysis.safe) {
      stats.blocked++;
      stats.threats.push({
        url,
        timestamp: new Date().toISOString(),
        type: urlAnalysis.details?.safeBrowsing ? 'SAFE_BROWSING' : 'SUSPICIOUS_URL',
        details: urlAnalysis.details
      });
      
      chrome.storage.local.set({ stats });
      
      return {
        safe: false,
        reason: 'unsafe-url',
        details: urlAnalysis.details
      };
    }
    
    // If content scanning is enabled and URL is initially safe
    const contentScanningEnabled = await SettingsService.isFeatureEnabled('contentScanning');
    if (contentScanningEnabled && urlAnalysis.safe) {
      try {
        const response = await fetch(url);
        const content = await response.text();
        const contentAnalysis = await AIService.scanWebsiteContent(content);
        
        // Get sensitivity thresholds
        const thresholds = await SettingsService.getSensitivityThresholds();
        
        // If content is flagged as suspicious
        if (contentAnalysis.riskScore > thresholds.content) {
          stats.blocked++;
          stats.threats.push({
            url,
            timestamp: new Date().toISOString(),
            type: 'SUSPICIOUS_CONTENT',
            details: contentAnalysis.details
          });
          
          chrome.storage.local.set({ stats });
          
          return {
            safe: false,
            reason: 'unsafe-content',
            details: contentAnalysis.details
          };
        }
      } catch (error) {
        console.error('Content scanning error:', error);
        // Continue even if content scanning fails
      }
    }
    
    // URL and content (if scanned) are safe
    chrome.storage.local.set({ stats });
    return { safe: true };
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return { safe: true, error: 'Failed to analyze URL' };
  }
}

// Show notification for blocked URLs
function showBlockNotification(url, reason) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: 'PhishGuard - Threat Detected',
    message: `A potentially dangerous website was blocked: ${url.substring(0, 50)}...`,
    buttons: [
      { title: 'View Details' },
      { title: 'Report False Positive' }
    ],
    priority: 2
  });
}

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId === 0) {  // Only check main frame navigation
    const settings = await SettingsService.getSettings();
    
    // Skip analysis if auto-block is disabled
    if (!settings.autoBlock) {
      return;
    }
    
    const result = await analyzeURL(details.url);
    if (!result.safe) {
      // Show warning page with detailed information
      chrome.tabs.update(details.tabId, {
        url: `warning.html?url=${encodeURIComponent(details.url)}&reason=${result.reason}&details=${encodeURIComponent(JSON.stringify(result.details))}`
      });
      
      // Show notification if enabled
      if (settings.showNotifications) {
        showBlockNotification(details.url, result.reason);
      }
    }
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.type) {
        case 'getStats':
          sendResponse(stats);
          break;
          
        case 'getAPIHealth':
          sendResponse(apiHealth);
          break;
          
        case 'checkURL':
          const result = await analyzeURL(request.url);
          sendResponse(result);
          break;
          
        case 'addToWhitelist':
          const whitelistResult = await ListService.addToWhitelist(request.url);
          sendResponse(whitelistResult);
          break;
          
        case 'addToBlacklist':
          const blacklistResult = await ListService.addToBlacklist(request.url);
          sendResponse(blacklistResult);
          break;
          
        case 'getWhitelist':
          const whitelist = await ListService.getWhitelist();
          sendResponse(whitelist);
          break;
          
        case 'getBlacklist':
          const blacklist = await ListService.getBlacklist();
          sendResponse(blacklist);
          break;
          
        case 'removeFromWhitelist':
          const removeWhiteResult = await ListService.removeFromWhitelist(request.domain);
          sendResponse(removeWhiteResult);
          break;
          
        case 'removeFromBlacklist':
          const removeBlackResult = await ListService.removeFromBlacklist(request.domain);
          sendResponse(removeBlackResult);
          break;
          
        case 'getSettings':
          const settings = await SettingsService.getSettings();
          sendResponse(settings);
          break;
          
        case 'updateSettings':
          const updateResult = await SettingsService.saveSettings(request.settings);
          sendResponse(updateResult);
          break;
          
        case 'submitFeedback':
          const feedbackResult = await FeedbackService.submitFeedback(
            request.feedbackType,
            request.url,
            request.details
          );
          sendResponse(feedbackResult);
          break;
          
        case 'clearHistory':
          stats.threats = [];
          chrome.storage.local.set({ stats });
          sendResponse({ success: true });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate we'll respond asynchronously
  return true;
});
