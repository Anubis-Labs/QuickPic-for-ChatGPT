// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadScreenshot' && message.screenshot) {
    uploadScreenshotToChatGPT(message.screenshot)
      .then(result => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error uploading screenshot:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

// Function to upload the screenshot to ChatGPT
async function uploadScreenshotToChatGPT(dataUrl) {
  try {
    // Find the file input element in ChatGPT
    const fileInput = await findFileInput();
    if (!fileInput) {
      throw new Error('Could not find the file input element in ChatGPT.');
    }

    // Convert data URL to File object
    const file = dataURLToFile(dataUrl, 'screenshot.png');

    // Create a DataTransfer object to simulate a file upload
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Set the file to the input
    fileInput.files = dataTransfer.files;

    // Dispatch input and change events to trigger ChatGPT's file upload handlers
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('Screenshot uploaded to ChatGPT successfully');
    return true;
  } catch (error) {
    console.error('Error uploading screenshot to ChatGPT:', error);
    throw error;
  }
}

// Function to find the file input element in ChatGPT's UI
async function findFileInput() {
  // There are different selectors we can try to find the file input
  const selectors = [
    'input[type="file"]',
    'input[accept="image/*,.pdf"]',
    'input[accept*="image"]',
    'form input[type="file"]',
    // Specific selectors for different versions of ChatGPT
    'div[data-message-author-role] input[type="file"]',
    'div.flex input[type="file"]'
  ];

  // Try each selector
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // Check if this is likely the correct file input (visible or within a visible container)
      if (element.offsetParent !== null || isElementInViewableContainer(element)) {
        return element;
      }
    }
  }

  // If no file input found with selectors, try to find the attachment button and click it
  const attachmentButton = findAttachmentButton();
  if (attachmentButton) {
    // Log that we found the button
    console.log('Found attachment button, clicking it');
    attachmentButton.click();
    
    // Wait a moment for the click to take effect and try again
    return new Promise(resolve => {
      setTimeout(() => {
        // Try to find the file input again after button click
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (element.offsetParent !== null || isElementInViewableContainer(element)) {
              console.log('Found file input after clicking button');
              resolve(element);
              return;
            }
          }
        }
        console.warn('Could not find file input even after clicking button');
        resolve(null);
      }, 500);
    });
  }

  // If still not found, look for hidden inputs as a last resort
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log('Using hidden file input as last resort');
      return elements[0]; // Try with the first one as a last resort
    }
  }

  return null;
}

// Function to find the attachment button in ChatGPT's UI
function findAttachmentButton() {
  // Look for buttons with specific aria labels or SVG icons
  const buttonSelectors = [
    'button[aria-label*="upload"]',
    'button[aria-label*="attach"]',
    'button svg[data-icon="paperclip"]',
    'button svg[data-icon="attach"]',
    'button[aria-label*="file"]',
    // More general selectors
    'button:has(svg)',
    '[role="button"]:has(svg)'
  ];

  // Also look for specific text content
  const buttonTexts = ['Attach files', 'Upload', 'Attach', 'Upload image'];

  // Try specific selectors first
  for (const selector of buttonSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (element.offsetParent !== null) {
        return element.closest('button') || element;
      }
    }
  }

  // Try to find buttons by their text content
  const allButtons = document.querySelectorAll('button, [role="button"]');
  for (const button of allButtons) {
    const buttonText = button.textContent.trim().toLowerCase();
    if (buttonTexts.some(text => buttonText.includes(text.toLowerCase()))) {
      if (button.offsetParent !== null) {
        return button;
      }
    }
  }

  // Look for any visible button with an SVG child
  const buttonsWithSvg = document.querySelectorAll('button:has(svg), [role="button"]:has(svg)');
  for (const button of buttonsWithSvg) {
    if (button.offsetParent !== null) {
      // Check if the button or its children contain icons that might be related to file uploads
      const svgs = button.querySelectorAll('svg');
      for (const svg of svgs) {
        // Check SVG's parent elements for hints about its purpose
        let parent = svg.parentElement;
        while (parent !== button && parent !== null) {
          if (parent.getAttribute('aria-label')?.toLowerCase().includes('file') ||
              parent.getAttribute('aria-label')?.toLowerCase().includes('upload') ||
              parent.getAttribute('aria-label')?.toLowerCase().includes('attach')) {
            return button;
          }
          parent = parent.parentElement;
        }
      }
    }
  }

  return null;
}

// Helper function to check if an element is within a viewable container
function isElementInViewableContainer(element) {
  let parent = element.parentElement;
  while (parent) {
    if (getComputedStyle(parent).display !== 'none' && getComputedStyle(parent).visibility !== 'hidden') {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

// Utility function to convert data URL to File object
function dataURLToFile(dataURL, filename) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
} 