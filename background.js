// Default settings
const defaultSettings = {
  captureMethod: 'tab', // tab, desktop, or clipboard
  showNotifications: true,
  autoClose: true
};

// Current settings
let currentSettings = Object.assign({}, defaultSettings);

// Load settings from storage
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ settings: defaultSettings }, (data) => {
      currentSettings = data.settings;
      resolve(currentSettings);
    });
  });
}

// Initialize settings
loadSettings();

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    currentSettings = changes.settings.newValue;
  }
});

// Listen for the keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === 'take-screenshot') {
    captureAndUploadScreenshot();
  }
});

// Main function to handle screenshot capture and upload
async function captureAndUploadScreenshot() {
  // Load latest settings
  await loadSettings();
  
  // Check if ChatGPT is open in any tab
  chrome.tabs.query({ 
    url: ["https://chat.openai.com/*", "https://chatgpt.com/*"], 
    currentWindow: true 
  }, async (chatGptTabs) => {
    if (chatGptTabs.length === 0) {
      // No ChatGPT tab found - log error
      console.error('Error: No ChatGPT tab found. Please open ChatGPT before taking a screenshot.');
      
      // Show notification
      if (currentSettings.showNotifications) {
        showNotificationOnActiveTab('Please open ChatGPT before taking a screenshot.');
      }
      return;
    }

    // Get active tab
    const chatGptTab = chatGptTabs[0];
    
    try {
      let screenshotDataUrl;
      
      // Choose capture method based on settings
      switch (currentSettings.captureMethod) {
        case 'tab':
          screenshotDataUrl = await captureCurrentTab();
          break;
        case 'desktop':
          screenshotDataUrl = await captureDesktop();
          break;
        case 'clipboard':
          screenshotDataUrl = await captureFromClipboard();
          break;
        default:
          screenshotDataUrl = await captureCurrentTab();
      }

      if (!screenshotDataUrl) {
        console.error('Failed to capture screenshot');
        return;
      }

      // Upload the screenshot to ChatGPT
      uploadScreenshotToChatGPT(chatGptTab.id, screenshotDataUrl);
      
    } catch (error) {
      console.error('Error during capture:', error);
      if (currentSettings.showNotifications) {
        showNotificationOnActiveTab('Error capturing screenshot: ' + error.message);
      }
    }
  });
}

// Method 1: Capture current tab
function captureCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(dataUrl);
    });
  });
}

// Method 2: Capture desktop/screen/window
function captureDesktop() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      
      // Use desktopCapture API to let user select a screen or window
      chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], activeTab.id, (streamId) => {
        if (!streamId) {
          reject(new Error('User cancelled screen selection'));
          return;
        }

        // Create a tab to handle screen capture
        chrome.tabs.create({ url: 'capture.html', active: true }, (captureTab) => {
          // We'll send the streamId to the capture page
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === captureTab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              
              // Send streamId to the capture page
              chrome.tabs.sendMessage(captureTab.id, { 
                action: 'captureDesktop', 
                streamId: streamId 
              }, (response) => {
                if (chrome.runtime.lastError) {
                  chrome.tabs.remove(captureTab.id);
                  reject(new Error('Failed to communicate with capture tab'));
                  return;
                }
                
                if (response && response.dataUrl) {
                  chrome.tabs.remove(captureTab.id);
                  resolve(response.dataUrl);
                } else {
                  chrome.tabs.remove(captureTab.id);
                  reject(new Error('Failed to capture screenshot'));
                }
              });
            }
          });
        });
      });
    });
  });
}

// Method 3: Capture from clipboard
function captureFromClipboard() {
  return new Promise((resolve, reject) => {
    // Create a temporary offscreen document to access clipboard
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      
      // Execute script to read clipboard
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          return new Promise((resolve, reject) => {
            try {
              navigator.clipboard.read().then(items => {
                for (const item of items) {
                  if (item.types.includes('image/png')) {
                    item.getType('image/png').then(blob => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result);
                      reader.onerror = () => reject(new Error('Failed to read clipboard image'));
                      reader.readAsDataURL(blob);
                    });
                    return;
                  }
                }
                reject(new Error('No image found in clipboard'));
              }).catch(err => {
                reject(new Error('Failed to read clipboard: ' + err.message));
              });
            } catch (err) {
              reject(new Error('Clipboard access error: ' + err.message));
            }
          });
        }
      }).then(results => {
        if (results && results[0] && results[0].result) {
          resolve(results[0].result);
        } else {
          reject(new Error('Failed to read image from clipboard'));
        }
      }).catch(err => {
        reject(err);
      });
    });
  });
}

// Upload the screenshot to ChatGPT
function uploadScreenshotToChatGPT(tabId, dataUrl) {
  // Send message to content script to trigger upload
  chrome.tabs.sendMessage(tabId, { 
    action: 'uploadScreenshot', 
    screenshot: dataUrl 
  }, (response) => {
    if (chrome.runtime.lastError || !response || !response.success) {
      console.error('Error uploading screenshot to ChatGPT:', 
        chrome.runtime.lastError || (response && response.error) || 'Unknown error');
      
      if (currentSettings.showNotifications) {
        showNotificationOnActiveTab('Error uploading screenshot to ChatGPT');
      }
    } else if (currentSettings.showNotifications) {
      showNotificationOnActiveTab('Screenshot uploaded successfully!', 'success');
    }
  });
}

// Function to show a notification in a tab
function showNotificationOnActiveTab(message, type = 'error') {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        
        // Use executeScript to show a notification in the tab
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (notificationMessage, notificationType) => {
            // Create a floating notification element
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = notificationType === 'success' ? '#10a37f' : '#f44336';
            notification.style.color = 'white';
            notification.style.padding = '12px 24px';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '10000';
            notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            notification.style.fontSize = '14px';
            notification.textContent = notificationMessage;
            
            // Add notification to page
            document.body.appendChild(notification);
            
            // Remove after 5 seconds
            setTimeout(() => {
              notification.style.opacity = '0';
              notification.style.transition = 'opacity 0.5s';
              setTimeout(() => notification.remove(), 500);
            }, 5000);
          },
          args: [message, type]
        }).catch(err => {
          console.error('Failed to show notification:', err);
        });
      }
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'takeScreenshot') {
    captureAndUploadScreenshot()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async responses
  }
}); 