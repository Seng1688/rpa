# LinkedIn Like Automation - RPA Script

An automated RPA script using Node.js and Puppeteer to click all "React Like" buttons on a webpage (e.g., LinkedIn).

## Features

- 🚀 Automated browser control with Puppeteer
- 👍 Finds and clicks all "React Like" buttons
- 📜 Auto-scrolls to load dynamic content
- ⚙️ Configurable settings
- 🔍 Skips already-liked posts
- 💻 Runs in visible browser mode (non-headless) by default

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Install dependencies:

```bash
npm install
```

This will install Puppeteer, which includes a bundled Chromium browser.

## Configuration

Edit `config.json` to customize the behavior:

```json
{
  "url": "YOUR_URL_HERE", // Default URL to open
  "headless": false, // Set to true for headless mode
  "waitTime": 2000, // Wait time after page load (ms)
  "scrollDelay": 1000, // Delay between scroll steps (ms)
  "clickDelay": 500 // Delay between clicks (ms)
}
```

### Configuration Options:

- **url**: The default URL to navigate to (can be overridden via command line)
- **headless**:
  - `false` - Shows the browser window (recommended for first run)
  - `true` - Runs in headless mode (faster, no UI)
- **waitTime**: Time to wait after page loads (helps ensure content is loaded)
- **scrollDelay**: Delay between scroll steps when auto-scrolling
- **clickDelay**: Delay between button clicks (helps avoid rate limiting)

## Usage

### Method 1: Using command line argument (recommended)

```bash
node index.js "https://www.linkedin.com/feed/"
```

### Method 2: Using config.json

1. Update the `url` field in `config.json`
2. Run:

```bash
npm start
```

## How It Works

1. **Launch Browser**: Opens Chrome browser
2. **Navigate**: Goes to the specified URL
3. **Wait & Load**: Waits for page to load completely
4. **Auto-Scroll**: Scrolls through the page to load all dynamic content
5. **Find Buttons**: Locates all buttons with:
   - `aria-label="React Like"`
   - Class containing `react-button__trigger`
6. **Click Buttons**: Clicks each button that isn't already liked
7. **Report**: Shows summary of actions taken

## Important Notes

### LinkedIn Usage

⚠️ **Important**:

- You must be **logged in** to LinkedIn before running the script
- LinkedIn may have rate limits - use appropriate delays
- Use responsibly and in accordance with LinkedIn's Terms of Service
- Consider manual login in the browser window that opens

### First Run

On first run, you may need to:

1. Log in to LinkedIn manually in the browser window
2. Complete any CAPTCHA challenges
3. Re-run the script after authentication

### Rate Limiting

To avoid being flagged:

- Increase `clickDelay` in config.json (e.g., 1000-2000ms)
- Don't run the script too frequently
- Use natural-looking delays

## Troubleshooting

### "No buttons found"

- Make sure you're logged in to LinkedIn
- Check that you're on a page with posts (e.g., feed)
- Increase `waitTime` in config.json

### Browser doesn't open

- Check that Node.js is installed: `node --version`
- Reinstall dependencies: `npm install`

### "Navigation timeout"

- Increase timeout in the code or check your internet connection
- Try running again

## Example Output

```
🚀 Starting browser automation...
📂 Navigating to: https://www.linkedin.com/feed/
⏳ Waiting 2000ms for page to fully load...
📜 Scrolling to load all content...
🔍 Finding all "React Like" buttons...
✅ Found 15 "React Like" button(s)
👍 Clicked button 1 of 15
👍 Clicked button 2 of 15
⏭️  Button 3 already liked, skipping...
...
✨ Automation complete! Clicked 12 out of 15 buttons.
```

## Customization

You can modify `index.js` to:

- Add login automation
- Target different button types
- Export data about posts
- Add more sophisticated error handling
- Implement retry logic

## License

ISC
