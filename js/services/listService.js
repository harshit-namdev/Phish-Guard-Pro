// Whitelist and Blacklist management service
class ListService {
    static async getWhitelist() {
        const result = await chrome.storage.local.get('whitelist');
        return result.whitelist || [];
    }

    static async getBlacklist() {
        const result = await chrome.storage.local.get('blacklist');
        return result.blacklist || [];
    }

    static async addToWhitelist(url) {
        try {
            // Extract domain from URL
            const domain = this.extractDomain(url);
            
            // Get current whitelist
            const whitelist = await this.getWhitelist();
            
            // Check if domain already exists
            if (!whitelist.includes(domain)) {
                whitelist.push(domain);
                await chrome.storage.local.set({ whitelist });
            }
            
            return { success: true, domain };
        } catch (error) {
            console.error('Error adding to whitelist:', error);
            return { success: false, error: error.message };
        }
    }

    static async addToBlacklist(url) {
        try {
            // Extract domain from URL
            const domain = this.extractDomain(url);
            
            // Get current blacklist
            const blacklist = await this.getBlacklist();
            
            // Check if domain already exists
            if (!blacklist.includes(domain)) {
                blacklist.push(domain);
                await chrome.storage.local.set({ blacklist });
            }
            
            return { success: true, domain };
        } catch (error) {
            console.error('Error adding to blacklist:', error);
            return { success: false, error: error.message };
        }
    }

    static async removeFromWhitelist(domain) {
        try {
            // Get current whitelist
            const whitelist = await this.getWhitelist();
            
            // Filter out the domain
            const newWhitelist = whitelist.filter(item => item !== domain);
            
            // Save updated whitelist
            await chrome.storage.local.set({ whitelist: newWhitelist });
            
            return { success: true };
        } catch (error) {
            console.error('Error removing from whitelist:', error);
            return { success: false, error: error.message };
        }
    }

    static async removeFromBlacklist(domain) {
        try {
            // Get current blacklist
            const blacklist = await this.getBlacklist();
            
            // Filter out the domain
            const newBlacklist = blacklist.filter(item => item !== domain);
            
            // Save updated blacklist
            await chrome.storage.local.set({ blacklist: newBlacklist });
            
            return { success: true };
        } catch (error) {
            console.error('Error removing from blacklist:', error);
            return { success: false, error: error.message };
        }
    }

    static async isWhitelisted(url) {
        try {
            const domain = this.extractDomain(url);
            const whitelist = await this.getWhitelist();
            return whitelist.some(item => domain.includes(item) || item.includes(domain));
        } catch (error) {
            console.error('Error checking whitelist:', error);
            return false;
        }
    }

    static async isBlacklisted(url) {
        try {
            const domain = this.extractDomain(url);
            const blacklist = await this.getBlacklist();
            return blacklist.some(item => domain.includes(item) || item.includes(domain));
        } catch (error) {
            console.error('Error checking blacklist:', error);
            return false;
        }
    }

    static extractDomain(url) {
        try {
            // Handle URLs without protocol
            if (!url.startsWith('http')) {
                url = 'http://' + url;
            }
            
            const urlObj = new URL(url);
            let domain = urlObj.hostname;
            
            // Remove 'www.' if present
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
            }
            
            return domain;
        } catch (error) {
            console.error('Error extracting domain:', error);
            return url; // Return original URL if parsing fails
        }
    }
}

export default ListService;
