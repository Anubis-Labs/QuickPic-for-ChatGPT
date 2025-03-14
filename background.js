// Listen for the keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === 'take-screenshot') {
    captureAndUploadScreenshot();
  }
});

// Function to capture screenshot and trigger upload
function captureAndUploadScreenshot() {
  // Check if ChatGPT is open in any tab (supporting both domains)
  chrome.tabs.query({ 
    url: ["https://chat.openai.com/*", "https://chatgpt.com/*"], 
    active: true, 
    currentWindow: true 
  }, (tabs) => {
    if (tabs.length === 0) {
      // No ChatGPT tab found - log error
      console.error('Error: Please open ChatGPT in the current tab before taking a screenshot.');
      
      // Try to show a notification on the active tab
      showNotificationInActiveTab('Please open ChatGPT before taking a screenshot.');
      return;
    }

    const activeTab = tabs[0];

    // Capture the visible content of the active tab
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing screenshot:', chrome.runtime.lastError);
        return;
      }

      // Send message to content script to trigger upload
      chrome.tabs.sendMessage(activeTab.id, { 
        action: 'uploadScreenshot', 
        screenshot: dataUrl 
      }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          console.error('Error uploading screenshot to ChatGPT:', 
            chrome.runtime.lastError || (response && response.error) || 'Unknown error');
        }
      });
    });
  });
}

// Function to show a notification in the active tab
function showNotificationInActiveTab(message) {
  try {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        
        // Use executeScript to show a notification in the tab
        chrome.scripting.executeScript({
          target: {tabId: tabId},
          func: (notificationMessage) => {
            // Create a floating notification element
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = '#f44336';
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
          args: [message]
        }).catch(err => {
          console.error('Failed to show notification:', err);
        });
      }
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Utility function to convert data URL to Blob
function dataURLToBlob(dataURL) {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'takeScreenshot') {
    captureAndUploadScreenshot();
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async responses
}); 