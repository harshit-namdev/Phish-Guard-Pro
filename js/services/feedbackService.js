class FeedbackService {
    static async submitFeedback(type, url, details) {
        try {
            // Get existing feedback data
            const result = await chrome.storage.local.get('feedback');
            const feedbackList = result.feedback || [];
            
            // Add new feedback
            const feedback = {
                type,
                url,
                details,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            feedbackList.push(feedback);
            
            // Save updated feedback list
            await chrome.storage.local.set({ feedback: feedbackList });
            
            // If online, try to submit to server (future implementation)
            this.submitToServer(feedback);
            
            return { success: true, feedback };
        } catch (error) {
            console.error('Error submitting feedback:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getFeedbackList() {
        try {
            const result = await chrome.storage.local.get('feedback');
            return result.feedback || [];
        } catch (error) {
            console.error('Error getting feedback list:', error);
            return [];
        }
    }
    
    static async clearFeedback() {
        try {
            await chrome.storage.local.set({ feedback: [] });
            return { success: true };
        } catch (error) {
            console.error('Error clearing feedback:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async submitToServer(feedback) {
        // This is a placeholder for future server-side implementation
        // In a production environment, this would send the feedback to a server
        console.log('Feedback would be sent to server:', feedback);
        return true;
    }
    
    static async reportFalsePositive(url, details = '') {
        return this.submitFeedback('falsePositive', url, details);
    }
    
    static async reportMissedPhishing(url, details = '') {
        return this.submitFeedback('missedPhishing', url, details);
    }
    
    static async reportBug(details) {
        return this.submitFeedback('bug', '', details);
    }
    
    static async reportSuggestion(details) {
        return this.submitFeedback('suggestion', '', details);
    }
}

export default FeedbackService;
