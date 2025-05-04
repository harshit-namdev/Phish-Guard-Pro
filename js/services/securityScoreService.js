class SecurityScoreService {
    static calculateScore(urlAnalysis, contentAnalysis, emailAnalysis) {
        const weights = {
            url: 0.4,
            content: 0.3,
            email: 0.3
        };

        const urlScore = this.normalizeURLScore(urlAnalysis);
        const contentScore = this.normalizeContentScore(contentAnalysis);
        const emailScore = this.normalizeEmailScore(emailAnalysis);

        return {
            overall: (
                urlScore * weights.url +
                contentScore * weights.content +
                emailScore * weights.email
            ).toFixed(2),
            components: {
                url: urlScore,
                content: contentScore,
                email: emailScore
            }
        };
    }

    static normalizeURLScore(analysis) {
        if (!analysis || analysis.error) return 0;
        return analysis.safe ? 1 : 0;
    }

    static normalizeContentScore(analysis) {
        if (!analysis || analysis.error) return 0;
        return 1 - (analysis.riskScore || 0);
    }

    static normalizeEmailScore(analysis) {
        if (!analysis || analysis.error) return 0;
        return 1 - (analysis.risk_score || 0);
    }

    static getScoreColor(score) {
        if (score >= 0.7) return '#4CAF50';  // Green
        if (score >= 0.4) return '#FFC107';  // Yellow
        return '#F44336';  // Red
    }

    static getRecommendations(score) {
        const recommendations = [];
        
        if (score < 0.7) {
            recommendations.push('Exercise caution with this website');
            if (score < 0.4) {
                recommendations.push('Strongly recommended to avoid this website');
                recommendations.push('Do not enter any personal information');
            }
        }

        return recommendations;
    }
}

export default SecurityScoreService;
