# QuickPic for ChatGPT

A Chrome extension that allows you to take screenshots in different ways and upload them directly to ChatGPT in your browser tab.

## Features

- **Multiple Screenshot Methods**:
  - **Tab Capture**: Capture the current browser tab
  - **Screen/Window Capture**: Select any screen, window, or application to capture
  - **Clipboard Monitoring**: Use your OS screenshot tools, then upload automatically from clipboard
- **Automatic Upload**: Screenshots are automatically uploaded to ChatGPT
- **Manual Upload Button**: A popup UI with a button for manual screenshot capture and upload
- **ChatGPT Integration**: Works seamlessly with ChatGPT's file upload feature
- **SVG Icon**: Uses a scalable vector graphic icon that looks crisp at any size
- **Customizable Settings**: Choose your preferred screenshot method and other options

## Installation

Since this extension is not published on the Chrome Web Store, you'll need to install it in developer mode. Here's how:

1. **Download or clone this repository** to your local machine
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the folder containing this extension
5. **The extension is now installed!** You should see the QuickPic icon in your Chrome toolbar

## Usage

1. **Navigate to [ChatGPT](https://chat.openai.com/)** or [ChatGPT](https://chatgpt.com/) in your browser
2. **Take a screenshot** using one of these methods:
   - Press Alt+S to automatically capture and upload using your selected method
   - Click the extension icon and then click "Capture & Upload Screenshot"
3. **The screenshot will be automatically uploaded** to your active ChatGPT conversation

### Screenshot Methods

- **Current Tab Capture**: Simplest method - captures only the visible part of the current browser tab
- **Screen/Window Capture**: Opens a selection dialog allowing you to choose an entire screen, window, or application
- **Clipboard Monitoring**: Use your OS screenshot tools (like Win+Shift+S on Windows), then the extension grabs the image from your clipboard

## Settings

To access settings, click the extension icon and then click "Settings & Other Capture Methods" at the bottom of the popup. You can configure:

- Which screenshot capture method to use
- Whether to show notifications
- Whether to auto-close the popup after capturing

## Troubleshooting

- **Extension not working?** Make sure you're on the ChatGPT website (https://chat.openai.com/ or https://chatgpt.com/)
- **Keyboard shortcut not working?** Try refreshing the page, or check Chrome's keyboard shortcuts settings at `chrome://extensions/shortcuts`
- **Upload fails?** ChatGPT's UI may have changed. Please open an issue to report this
- **Screen/Window capture not working?** Make sure you've given Chrome permission to capture your screen

## Technical Details

This extension uses:
- `chrome.tabs.captureVisibleTab()` for tab captures
- `chrome.desktopCapture` for screen/window captures
- `navigator.clipboard` API for clipboard monitoring
- The `DataTransfer` API to simulate file uploads
- Content scripts that run only on ChatGPT pages
- Background scripts to handle keyboard shortcuts
- SVG for scalable, resolution-independent icons

## Icon Details

The extension uses a single SVG icon file (`icon.svg`) instead of multiple PNG files. The SVG icon:
- Is automatically scaled by Chrome for different contexts
- Maintains crisp quality at any size
- Reduces the extension package size
- Matches ChatGPT's color scheme (#10a37f)

## License

MIT License 