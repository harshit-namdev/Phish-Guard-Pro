# PhishGuard Pro: Advanced Phishing & Security Protection

A powerful browser extension that protects users from phishing attempts, malicious links, and suspicious websites using advanced detection techniques and AI-powered analysis.

## Key Features

### Core Security Features
- **Real-time URL Analysis**: Scans URLs in real-time using multiple detection methods
- **Whitelist & Blacklist Management**: Customize protection with trusted and blocked domains
- **Customizable Security Levels**: Adjust sensitivity (Low, Medium, High) based on your needs
- **API Health Monitoring**: Shows the status of security APIs for reliable protection
- **Detailed Threat Information**: Comprehensive information about detected threats

### User Experience
- **Modern, User-Friendly Interface**: Clean and intuitive UI with tabbed navigation
- **User Feedback System**: Report false positives to improve detection accuracy
- **Threat History**: View and manage a log of all detected threats
- **Visual Status Indicators**: Color-coded warnings and status indicators
- **Notification System**: Optional alerts when threats are detected

### Advanced Protection
- **Content Analysis**: Optional scanning of website content for suspicious patterns
- **Safe Browsing Integration**: Uses Google Safe Browsing API for reliable threat detection
- **URL Pattern Analysis**: Detects suspicious URL patterns commonly used in phishing

## Complete Setup Instructions

### 1. API Key Setup

1. **Get a Google Safe Browsing API key**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to APIs & Services > Library
   - Search for "Safe Browsing API" and enable it
   - Go to APIs & Services > Credentials
   - Create an API key and copy it

2. **Configure the extension with your API key**:
   - Open `js/config.js`
   - Replace `YOUR_API_KEY` with your actual Google Safe Browsing API key

### 2. Installation

#### Chrome / Edge / Brave
1. Open your browser and go to `chrome://extensions/` (or equivalent)
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the PhishGuard directory
5. The extension should now appear in your toolbar

#### Firefox
1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the PhishGuard directory and select the `manifest.json` file

### 3. Initial Configuration

1. Click on the PhishGuard icon in your browser toolbar
2. Go to the "Settings" tab
3. Configure your preferred security settings:
   - Auto-block dangerous sites (on/off)
   - Show notifications (on/off)
   - Scan website content (on/off)
   - Detection sensitivity (Low/Medium/High)
4. Go to the "Lists" tab to add any trusted domains to your whitelist

## Usage Guide

### Home Tab
- View protection status and statistics
- Check the current page for threats
- Report phishing websites
- View your threat history

### Lists Tab
- Manage your whitelist (trusted sites that won't be blocked)
- Manage your blacklist (sites that will always be blocked)
- Add new domains to either list

### Settings Tab
- Configure auto-blocking behavior
- Enable/disable notifications
- Enable/disable content scanning
- Adjust detection sensitivity
- Clear history or reset settings

### When a Threat is Detected
1. A warning page will appear with details about the threat
2. You can choose to:
   - Go back (recommended)
   - Add the site to your whitelist (if you believe it's safe)
   - Proceed anyway (not recommended)
3. You can also submit feedback if you believe it's a false positive

## Security Best Practices

- Keep PhishGuard enabled at all times, especially when browsing unfamiliar websites
- Regularly check your threat history to stay informed about blocked threats
- Use Medium or High sensitivity when visiting financial or sensitive websites
- Always report suspected phishing attempts
- Add trusted websites to your whitelist to prevent false positives
- Keep the extension updated with the latest version

## Technical Details

The extension is built using:
- Chrome Extensions Manifest V3
- Google Safe Browsing API v4
- Modern JavaScript (ES6+)
- Pattern-based URL and content analysis
- Local storage for settings, whitelist/blacklist, and statistics
- Asynchronous background processing

## Troubleshooting

- **Extension blocking too many sites**: Lower the sensitivity in Settings or add trusted domains to your whitelist
- **Extension not blocking known phishing sites**: Increase sensitivity and ensure API health is "Operational"
- **API showing as "Offline"**: Check your internet connection and verify your API key in config.js

## Privacy Statement

PhishGuard respects your privacy:
- No personal browsing data is collected or transmitted
- All settings and lists are stored locally on your device
- API requests only include the minimum information needed for threat detection
- User feedback is anonymized before submission
