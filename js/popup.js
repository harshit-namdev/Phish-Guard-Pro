document.addEventListener('DOMContentLoaded', () => {
  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}Tab`).classList.add('active');
    });
  });
  
  // Update stats
  updateStats();
  
  // Check API health
  checkAPIHealth();
  
  // Load settings
  loadSettings();
  
  // Load whitelist and blacklist
  loadWhitelist();
  loadBlacklist();
  
  // Button event listeners
  document.getElementById('reportPhish').addEventListener('click', reportPhishing);
  document.getElementById('checkCurrentPage').addEventListener('click', checkCurrentPage);
  document.getElementById('viewHistory').addEventListener('click', viewThreatHistory);
  document.getElementById('addToWhitelist').addEventListener('click', addToWhitelist);
  document.getElementById('addToBlacklist').addEventListener('click', addToBlacklist);
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  
  // Settings toggle event listeners
  document.getElementById('autoBlockToggle').addEventListener('change', updateSetting);
  document.getElementById('notificationsToggle').addEventListener('change', updateSetting);
  document.getElementById('contentScanToggle').addEventListener('change', updateSetting);
  
  // Sensitivity options
  const sensitivityOptions = document.querySelectorAll('.sensitivity-option');
  sensitivityOptions.forEach(option => {
    option.addEventListener('click', () => {
      sensitivityOptions.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      updateSensitivity(option.getAttribute('data-value'));
    });
  });
});

// Update stats display
function updateStats() {
  chrome.runtime.sendMessage({ type: 'getStats' }, (stats) => {
    if (stats) {
      document.getElementById('scannedCount').textContent = stats.scanned || 0;
      document.getElementById('blockedCount').textContent = stats.blocked || 0;
    }
  });
}

// Check API health status
function checkAPIHealth() {
  chrome.runtime.sendMessage({ type: 'getAPIHealth' }, (health) => {
    if (health) {
      const indicator = document.querySelector('.api-indicator');
      const statusText = document.querySelector('#apiStatus span');
      
      indicator.className = 'api-indicator';
      
      switch (health.status) {
        case 'operational':
          indicator.classList.add('api-operational');
          statusText.textContent = 'API: Operational';
          break;
        case 'degraded':
          indicator.classList.add('api-degraded');
          statusText.textContent = 'API: Degraded';
          break;
        case 'offline':
          indicator.classList.add('api-offline');
          statusText.textContent = 'API: Offline';
          break;
        default:
          indicator.classList.add('api-degraded');
          statusText.textContent = 'API: Unknown';
      }
    }
  });
}

// Load user settings
function loadSettings() {
  chrome.runtime.sendMessage({ type: 'getSettings' }, (settings) => {
    if (settings) {
      // Set toggle states
      document.getElementById('autoBlockToggle').checked = settings.autoBlock;
      document.getElementById('notificationsToggle').checked = settings.showNotifications;
      document.getElementById('contentScanToggle').checked = settings.contentScanning;
      
      // Set sensitivity
      const sensitivityOptions = document.querySelectorAll('.sensitivity-option');
      sensitivityOptions.forEach(option => {
        if (option.getAttribute('data-value') === settings.sensitivity) {
          sensitivityOptions.forEach(o => o.classList.remove('active'));
          option.classList.add('active');
        }
      });
    }
  });
}

// Update a setting when toggle changes
function updateSetting(event) {
  const settingId = event.target.id;
  const value = event.target.checked;
  
  let settingName = '';
  switch (settingId) {
    case 'autoBlockToggle':
      settingName = 'autoBlock';
      break;
    case 'notificationsToggle':
      settingName = 'showNotifications';
      break;
    case 'contentScanToggle':
      settingName = 'contentScanning';
      break;
  }
  
  if (settingName) {
    chrome.runtime.sendMessage({
      type: 'updateSettings',
      settings: { [settingName]: value }
    });
  }
}

// Update sensitivity setting
function updateSensitivity(value) {
  chrome.runtime.sendMessage({
    type: 'updateSettings',
    settings: { sensitivity: value }
  });
}

// Load whitelist
function loadWhitelist() {
  chrome.runtime.sendMessage({ type: 'getWhitelist' }, (whitelist) => {
    const container = document.getElementById('whitelistContainer');
    container.innerHTML = '';
    
    if (whitelist && whitelist.length > 0) {
      whitelist.forEach(domain => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <span class="list-item-text">${domain}</span>
          <span class="list-item-action" data-domain="${domain}">Remove</span>
        `;
        container.appendChild(item);
      });
      
      // Add event listeners to remove buttons
      container.querySelectorAll('.list-item-action').forEach(button => {
        button.addEventListener('click', () => {
          const domain = button.getAttribute('data-domain');
          removeFromWhitelist(domain);
        });
      });
    } else {
      container.innerHTML = '<div class="list-item">No domains in whitelist</div>';
    }
  });
}

// Load blacklist
function loadBlacklist() {
  chrome.runtime.sendMessage({ type: 'getBlacklist' }, (blacklist) => {
    const container = document.getElementById('blacklistContainer');
    container.innerHTML = '';
    
    if (blacklist && blacklist.length > 0) {
      blacklist.forEach(domain => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <span class="list-item-text">${domain}</span>
          <span class="list-item-action" data-domain="${domain}">Remove</span>
        `;
        container.appendChild(item);
      });
      
      // Add event listeners to remove buttons
      container.querySelectorAll('.list-item-action').forEach(button => {
        button.addEventListener('click', () => {
          const domain = button.getAttribute('data-domain');
          removeFromBlacklist(domain);
        });
      });
    } else {
      container.innerHTML = '<div class="list-item">No domains in blacklist</div>';
    }
  });
}

// Add domain to whitelist
function addToWhitelist() {
  const input = document.getElementById('whitelistInput');
  const domain = input.value.trim();
  
  if (domain) {
    chrome.runtime.sendMessage({
      type: 'addToWhitelist',
      url: domain
    }, response => {
      if (response && response.success) {
        input.value = '';
        loadWhitelist();
      } else {
        alert('Failed to add domain to whitelist');
      }
    });
  }
}

// Add domain to blacklist
function addToBlacklist() {
  const input = document.getElementById('blacklistInput');
  const domain = input.value.trim();
  
  if (domain) {
    chrome.runtime.sendMessage({
      type: 'addToBlacklist',
      url: domain
    }, response => {
      if (response && response.success) {
        input.value = '';
        loadBlacklist();
      } else {
        alert('Failed to add domain to blacklist');
      }
    });
  }
}

// Remove domain from whitelist
function removeFromWhitelist(domain) {
  chrome.runtime.sendMessage({
    type: 'removeFromWhitelist',
    domain: domain
  }, response => {
    if (response && response.success) {
      loadWhitelist();
    } else {
      alert('Failed to remove domain from whitelist');
    }
  });
}

// Remove domain from blacklist
function removeFromBlacklist(domain) {
  chrome.runtime.sendMessage({
    type: 'removeFromBlacklist',
    domain: domain
  }, response => {
    if (response && response.success) {
      loadBlacklist();
    } else {
      alert('Failed to remove domain from blacklist');
    }
  });
}

// Report phishing website
function reportPhishing() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    // Open Google's phishing reporting page in a new tab
    chrome.tabs.create({
      url: `https://safebrowsing.google.com/safebrowsing/report_phish/?url=${encodeURIComponent(currentUrl)}`
    });
  });
}

// Check current page for phishing
function checkCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    
    // Update UI to show checking status
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    
    status.className = 'status status-warning';
    statusText.textContent = 'Checking...';
    
    // Send message to check URL
    chrome.runtime.sendMessage({
      type: 'checkURL',
      url: currentUrl
    }, result => {
      if (result) {
        if (result.safe) {
          status.className = 'status status-safe';
          statusText.textContent = 'This site appears safe';
        } else {
          status.className = 'status status-danger';
          statusText.textContent = 'Warning: Potential threat detected!';
        }
      } else {
        status.className = 'status status-warning';
        statusText.textContent = 'Unable to check this site';
      }
    });
  });
}

// View threat history
function viewThreatHistory() {
  chrome.runtime.sendMessage({ type: 'getStats' }, (stats) => {
    if (stats && stats.threats && stats.threats.length > 0) {
      // Create and open a new tab with threat history
      const historyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PhishGuard - Threat History</title>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            .threat { margin: 10px 0; padding: 10px; border: 1px solid #eee; border-radius: 4px; }
            .threat-url { word-break: break-all; }
            .threat-type { color: #e74c3c; font-weight: bold; }
            .threat-time { color: #7f8c8d; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>PhishGuard Threat History</h1>
          <div id="threats">
            ${stats.threats.map(threat => `
              <div class="threat">
                <div class="threat-url">${threat.url}</div>
                <div class="threat-type">Threat type: ${threat.type}</div>
                <div class="threat-time">Detected: ${new Date(threat.timestamp).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([historyHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      chrome.tabs.create({ url });
    } else {
      alert('No threats have been detected yet.');
    }
  });
}

// Clear threat history
function clearHistory() {
  if (confirm('Are you sure you want to clear your threat history?')) {
    chrome.runtime.sendMessage({ type: 'clearHistory' }, (response) => {
      if (response && response.success) {
        updateStats();
        alert('Threat history cleared successfully.');
      } else {
        alert('Failed to clear threat history.');
      }
    });
  }
}

// Reset all settings to default
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    chrome.runtime.sendMessage({ type: 'resetSettings' }, (response) => {
      if (response && response.success) {
        loadSettings();
        alert('Settings have been reset to default.');
      } else {
        alert('Failed to reset settings.');
      }
    });
  }
}
