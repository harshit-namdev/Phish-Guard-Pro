import CONFIG from '../config.js';
import SettingsService from './settingsService.js';

class AIService {
    static async analyzeEmail(emailContent) {
        try {
            const response = await fetch(CONFIG.OPENAI_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getOpenAIKey()}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "system",
                        content: "Analyze this email content for phishing indicators. Return a JSON with: risk_score, indicators, and recommendation"
                    }, {
                        role: "user",
                        content: emailContent
                    }]
                })
            });

            const data = await response.json();
            return this.processEmailAnalysis(data);
        } catch (error) {
            console.error('Email analysis error:', error);
            return { error: 'Failed to analyze email content' };
        }
    }

    static async analyzeURL(url) {
        try {
            // Check if content scanning is enabled
            const contentScanningEnabled = await SettingsService.isFeatureEnabled('contentScanning');
            
            // Get sensitivity thresholds
            const thresholds = await SettingsService.getSensitivityThresholds();
            
            // Perform basic URL analysis
            const safeBrowsingResult = await this.checkSafeBrowsing(url);
            const urlPatternScore = this.analyzeURLPatterns(url);
            
            // Calculate URL safety score
            const isSafe = this.calculateURLSafetyScore(
                safeBrowsingResult, 
                urlPatternScore,
                thresholds.url
            );
            
            return {
                safe: isSafe,
                details: {
                    safeBrowsing: safeBrowsingResult,
                    patternAnalysis: urlPatternScore
                }
            };
        } catch (error) {
            console.error('URL analysis error:', error);
            return { safe: true, error: 'Failed to analyze URL' };
        }
    }

    static async scanWebsiteContent(content) {
        try {
            // Simple content analysis without external API calls
            const suspiciousPatterns = this.detectSuspiciousPatterns(content);
            
            // Get sensitivity thresholds
            const thresholds = await SettingsService.getSensitivityThresholds();
            
            // Calculate risk score (0 to 1, higher is more risky)
            const riskScore = Math.min(suspiciousPatterns.length * 0.1, 1.0);
            
            return {
                riskScore,
                details: {
                    suspiciousPatterns
                }
            };
        } catch (error) {
            console.error('Content scanning error:', error);
            return { riskScore: 0, error: 'Failed to scan website content' };
        }
    }

    // Helper methods
    static async checkSafeBrowsing(url) {
        try {
            const requestBody = {
                client: {
                    clientId: 'PhishGuard',
                    clientVersion: '1.0.0'
                },
                threatInfo: {
                    threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                    platformTypes: ['ANY_PLATFORM'],
                    threatEntryTypes: ['URL'],
                    threatEntries: [{ url: url }]
                }
            };

            const response = await fetch(`${CONFIG.SAFE_BROWSING_API_URL}?key=${CONFIG.SAFE_BROWSING_API_KEY}`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            return !(data.matches && data.matches.length > 0);
        } catch (error) {
            console.error('Safe Browsing API error:', error);
            return true; // Assume safe if API fails
        }
    }

    static analyzeURLPatterns(url) {
        // Less aggressive pattern matching
        const suspiciousPatterns = [
            /^https?:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\//,  // IP addresses only
            /^https?:\/\/[^/]+\.[^/]{2,3}\.[^/]{2,3}\.[^/]{2,3}/,  // Multiple subdomains (4+)
            /\.(tk|ml|ga|cf|gq)\//, // Free domains often used in phishing
            /\b(password|login|signin|bank|account|security|verify)\b.*\b(verify|confirm|update|secure)\b/i,  // Multiple suspicious keywords
        ];

        let score = 1.0;
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(url)) {
                score -= 0.15; // Less aggressive penalty
            }
        }
        return Math.max(0, score);
    }

    static calculateURLSafetyScore(safeBrowsing, patternScore, threshold) {
        // If Google Safe Browsing API flags it, immediately consider unsafe
        if (!safeBrowsing) {
            return false;
        }
        
        // Otherwise, check pattern score against threshold
        return patternScore >= threshold;
    }

    static detectSuspiciousPatterns(content) {
        const patterns = [
            /<form[^>]*>.*?<input[^>]*password[^>]*>.*?<\/form>/is, // Login forms
            /verify.*?account|confirm.*?details|update.*?information/i, // Common phishing phrases
            /<script[^>]*>[^<]*document\.cookie[^<]*<\/script>/i, // Cookie stealing
            /<iframe[^>]*style=['"]display:\s*none['"][^>]*>/i, // Hidden iframes
        ];

        const matches = [];
        for (const pattern of patterns) {
            if (pattern.test(content)) {
                matches.push(pattern.toString().replace(/^\/|\/[gimyus]*$/g, ''));
            }
        }

        return matches;
    }

    static async getOpenAIKey() {
        // Implement secure key retrieval
        return await chrome.storage.local.get('openai_key');
    }
}

export default AIService;
