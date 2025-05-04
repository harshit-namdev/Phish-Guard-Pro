import CONFIG from '../config.js';

class SettingsService {
    static async getSettings() {
        try {
            const result = await chrome.storage.local.get('settings');
            return result.settings || this.getDefaultSettings();
        } catch (error) {
            console.error('Error getting settings:', error);
            return this.getDefaultSettings();
        }
    }

    static async saveSettings(settings) {
        try {
            await chrome.storage.local.set({ settings });
            return { success: true };
        } catch (error) {
            console.error('Error saving settings:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateSetting(key, value) {
        try {
            const settings = await this.getSettings();
            settings[key] = value;
            await this.saveSettings(settings);
            return { success: true };
        } catch (error) {
            console.error(`Error updating setting ${key}:`, error);
            return { success: false, error: error.message };
        }
    }

    static getDefaultSettings() {
        return { ...CONFIG.DEFAULT_SETTINGS };
    }

    static async getSensitivityThresholds() {
        const settings = await this.getSettings();
        
        // Adjust thresholds based on sensitivity setting
        switch (settings.sensitivity) {
            case 'low':
                return {
                    url: 0.4,
                    content: 0.7
                };
            case 'high':
                return {
                    url: 0.7,
                    content: 0.9
                };
            case 'medium':
            default:
                return {
                    url: CONFIG.URL_ANALYSIS_THRESHOLD,
                    content: CONFIG.CONTENT_ANALYSIS_THRESHOLD
                };
        }
    }

    static async isFeatureEnabled(featureName) {
        // Check if feature exists in CONFIG.FEATURES
        if (!(featureName in CONFIG.FEATURES)) {
            return false;
        }
        
        // Get user settings
        const settings = await this.getSettings();
        
        // Check if feature is explicitly disabled in user settings
        if (settings.disabledFeatures && settings.disabledFeatures.includes(featureName)) {
            return false;
        }
        
        // Return default config value
        return CONFIG.FEATURES[featureName];
    }
}

export default SettingsService;
