// Monitor DOM changes for dynamic content
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            scanPage();
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Scan page for potential threats
function scanPage() {
    // Scan for suspicious forms
    scanForms();
    
    // Scan for suspicious links
    scanLinks();
    
    // Scan for email content
    if (window.location.href.includes('mail')) {
        scanEmailContent();
    }
}

function scanForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        let sensitiveInputs = 0;
        
        inputs.forEach(input => {
            if (input.type === 'password' || 
                input.name?.toLowerCase().includes('password') ||
                input.name?.toLowerCase().includes('credit') ||
                input.name?.toLowerCase().includes('card')) {
                sensitiveInputs++;
            }
        });

        if (sensitiveInputs > 0) {
            // Check if form submission goes to a different domain
            form.addEventListener('submit', (e) => {
                const formDomain = new URL(form.action).hostname;
                const pageDomain = window.location.hostname;
                
                if (formDomain !== pageDomain) {
                    e.preventDefault();
                    chrome.runtime.sendMessage({
                        type: 'suspiciousForm',
                        details: {
                            action: form.action,
                            pageDomain,
                            formDomain
                        }
                    });
                }
            });
        }
    });
}

function scanLinks() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        const url = link.href;
        if (url.startsWith('http')) {
            chrome.runtime.sendMessage({
                type: 'checkLink',
                url: url
            }, response => {
                if (response && !response.safe) {
                    markDangerousLink(link, response.securityScore);
                }
            });
        }
    });
}

function scanEmailContent() {
    const emailContainers = document.querySelectorAll([
        '.email-content',
        '.message-body',
        '.mail-content',
        // Add more selectors based on email providers
    ].join(','));

    emailContainers.forEach(container => {
        if (!container.dataset.scanned) {
            container.dataset.scanned = 'true';
            chrome.runtime.sendMessage({
                type: 'analyzeEmail',
                content: container.innerText
            }, response => {
                if (response && response.risk_score > 0.7) {
                    markDangerousEmail(container, response);
                }
            });
        }
    });
}

function markDangerousLink(link, score) {
    link.style.border = '2px solid red';
    link.style.padding = '2px 4px';
    link.style.position = 'relative';
    
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: absolute;
        background: #ff4444;
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        display: none;
        width: 200px;
        top: 100%;
        left: 0;
    `;
    warning.textContent = `⚠️ Security Risk (Score: ${score})`;
    
    link.appendChild(warning);
    link.addEventListener('mouseover', () => warning.style.display = 'block');
    link.addEventListener('mouseout', () => warning.style.display = 'none');
    
    link.addEventListener('click', (e) => {
        if (score < 0.4) {
            e.preventDefault();
            if (confirm('This link appears to be dangerous. Are you sure you want to proceed?')) {
                window.location.href = link.href;
            }
        }
    });
}

function markDangerousEmail(container, analysis) {
    const warning = document.createElement('div');
    warning.style.cssText = `
        background: #fff4f4;
        border: 2px solid #ff4444;
        color: #ff4444;
        padding: 12px;
        margin: 8px 0;
        border-radius: 4px;
        font-size: 14px;
    `;
    
    warning.innerHTML = `
        <strong>⚠️ Potential Phishing Email Detected</strong><br>
        Risk Score: ${(analysis.risk_score * 100).toFixed(1)}%<br>
        ${analysis.indicators.map(i => `• ${i}`).join('<br>')}
        <br>
        <em>${analysis.recommendation}</em>
    `;
    
    container.insertBefore(warning, container.firstChild);
}

// Initial scan
scanPage();
