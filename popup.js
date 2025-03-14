// Default settings
const defaultSettings = {
  captureMethod: 'tab', // tab, desktop, or clipboard
  showNotifications: true,
  autoClose: true
};

// Current settings
let currentSettings = Object.assign({}, defaultSettings);

document.addEventListener('DOMContentLoaded', function() {
  const captureButton = document.getElementById('captureButton');
  const statusElement = document.getElementById('status');
  const captureMethodDisplay = document.getElementById('captureMethodDisplay');
  const openOptionsLink = document.getElementById('openOptions');

  // Load settings
  loadSettings().then(updateUI);

  // Add event listener for the capture button
  captureButton.addEventListener('click', function() {
    // Show loading status
    showStatus('Capturing screenshot...');

    // Check if active tab is ChatGPT (on either domain)
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      if (!isChatGPTTab(activeTab.url)) {
        showStatus('Error: Please open ChatGPT tab first', 'error');
        return;
      }

      // Send message to background script to take and upload screenshot
      chrome.runtime.sendMessage({ action: 'takeScreenshot' }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          return;
        }

        if (response && response.success) {
          showStatus('Screenshot uploaded successfully!');
          
          // Clear status after a few seconds
          setTimeout(() => {
            statusElement.textContent = '';
          }, 3000);
          
          // Close popup after successful upload if auto-close is enabled
          if (currentSettings.autoClose) {
            setTimeout(() => {
              window.close();
            }, 1500);
          }
        } else {
          showStatus('Error uploading screenshot', 'error');
        }
      });
    });
  });

  // Add event listener for the options link
  openOptionsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Function to show status messages
  function showStatus(message, type = 'success') {
    statusElement.textContent = message;
    statusElement.style.color = type === 'success' ? '#10a37f' : '#e53e3e';
  }

  // Function to check if a URL is a ChatGPT tab (on either domain)
  function isChatGPTTab(url) {
    return url.includes('chat.openai.com') || url.includes('chatgpt.com');
  }

  // Function to update the UI based on settings
  function updateUI() {
    // Update the capture method display
    switch (currentSettings.captureMethod) {
      case 'tab':
        captureMethodDisplay.textContent = 'Current Tab Capture';
        break;
      case 'desktop':
        captureMethodDisplay.textContent = 'Screen/Window Capture';
        break;
      case 'clipboard':
        captureMethodDisplay.textContent = 'Clipboard Monitoring';
        break;
      default:
        captureMethodDisplay.textContent = 'Current Tab Capture';
    }

    // Check if we're on a ChatGPT tab and update UI accordingly
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      
      if (!isChatGPTTab(activeTab.url)) {
        captureButton.disabled = true;
        captureButton.style.backgroundColor = '#aaa';
        captureButton.style.cursor = 'not-allowed';
        showStatus('Please open ChatGPT to use this extension', 'error');
      }
    });
  }
});

// Load settings from storage
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ settings: defaultSettings }, (data) => {
      currentSettings = data.settings;
      resolve(currentSettings);
    });
  });
} 