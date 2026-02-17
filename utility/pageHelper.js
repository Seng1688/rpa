import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, "..", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

export const PageHelper = {
  /**
   * Wait for an XPath and return the first matching ElementHandle
   */
  async waitForXPathEl(page, xpath, opts = {}) {
    const timeout = opts.timeout || 30000;

    try {
      // Use page.locator with XPath for newer Puppeteer versions
      const locator = page.locator(`xpath/${xpath}`);
      await locator.setTimeout(timeout);

      // Wait for the element to be present
      await locator.wait();

      // Get the element handle
      const handle = await locator.waitHandle();

      if (!handle) {
        throw new Error(`XPath found no element: ${xpath}`);
      }

      // Optional visibility check
      if (opts.visible) {
        const isVisible = await page.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return (
            style &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            rect.width > 0 &&
            rect.height > 0
          );
        }, handle);

        if (!isVisible) {
          throw new Error(`Element found but not visible: ${xpath}`);
        }
      }

      return handle;
    } catch (error) {
      throw new Error(
        `Failed to find element with XPath: ${xpath}. Error: ${error.message}`,
      );
    }
  },

  /**
   * Wait + click by XPath
   */
  async clickXPath(page, xpath, opts = {}) {
    const el = await this.waitForXPathEl(page, xpath, opts);
    await el.click();
    await el.dispose();
  },

  /**
   * Wait + get textContent
   */
  async textXPath(page, xpath, opts = {}) {
    const el = await this.waitForXPathEl(page, xpath, opts);
    const text = await page.evaluate((node) => node.textContent || "", el);
    await el.dispose();
    return text.trim();
  },

  /**
   * Return handle without disposing
   */
  async getXPathHandle(page, xpath, opts = {}) {
    return this.waitForXPathEl(page, xpath, opts);
  },

  async openBrowser(url) {
    console.log("🚀 Starting browser automation...");
    let browser, page;

    // Launch browser with a separate Chrome profile for automation
    browser = await puppeteer.launch({
      headless: config.headless,
      defaultViewport: null,
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      userDataDir: path.join(__dirname, "chrome-data"),
      args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();

    console.log(`📂 Navigating to: ${url}`);
    await PageHelper.goto(page, url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // await login(page);

    // console.log(`⏳ Waiting for page content to load...`);
    // Wait for search results to appear instead of fixed timeout
    //   await page.waitForSelector('div[data-view-name="people-search-result"]', {
    //     timeout: 30000
    //   });

    return { browser, page };
  },

  async goto(page, url, options = {}) {
    console.log(`📂 Navigating to: ${url}`);

    try {
      await page.goto(url, options);
      console.log(`✅ Navigation successful: ${url}`);
    } catch (error) {
      console.log(`❌ Navigation failed: ${url}`);
      throw error;
    }
  },

  async evaluate(page, fn, ...args) {
    console.log(`🔍 Evaluating function in page context...`);

    try {
      const result = await page.evaluate(fn, ...args);
      console.log(`✅ Evaluation successful`);
      return result;
    } catch (error) {
      console.log(`❌ Evaluation failed`);
      throw error;
    }
  },
};
