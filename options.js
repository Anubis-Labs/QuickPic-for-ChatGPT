// Default settings
const defaultSettings = {
  captureMethod: 'tab', // tab, desktop, or clipboard
  showNotifications: true,
  autoClose: true
};

// Save settings to Chrome storage
function saveSettings() {
  const settings = {
    captureMethod: document.querySelector('input[name="captureMethod"]:checked').value,
    showNotifications: document.getElementById('showNotifications').checked,
    autoClose: document.getElementById('autoClose').checked
  };
  
  chrome.storage.sync.set({ settings }, () => {
    // Show saved status
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

// Load settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get({ settings: defaultSettings }, (data) => {
    const settings = data.settings;
    
    // Set capture method radio button
    document.querySelector(`input[name="captureMethod"][value="${settings.captureMethod}"]`).checked = true;
    
    // Set checkboxes
    document.getElementById('showNotifications').checked = settings.showNotifications;
    document.getElementById('autoClose').checked = settings.autoClose;
  });
}

// Initialize settings page
document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  loadSettings();
  
  // Add event listener for save button
  document.getElementById('save').addEventListener('click', saveSettings);
}); 