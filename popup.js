document.addEventListener('DOMContentLoaded', function() {
  const captureButton = document.getElementById('captureButton');
  const statusElement = document.getElementById('status');

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
          
          // Close popup after successful upload
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          showStatus('Error uploading screenshot', 'error');
        }
      });
    });
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
}); 