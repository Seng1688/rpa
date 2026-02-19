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
  // click xPath in page
  async waitForXPathEl(page, xpath, opts = {}) {
    const timeout = opts.timeout || 20000;
    const visible = opts.visible || true;

    try {
      // Use page.locator with XPath for newer Puppeteer versions
      const handle = await page.waitForSelector(`xpath/${xpath}`, {
        timeout,
        visible,
      });

      if (!handle) {
        throw new Error(`XPath found no element: ${xpath}`);
      }

      return handle;
    } catch (error) {
      throw new Error(
        `Failed to find element with XPath: ${xpath}. Error: ${error.message}`,
      );
    }
  },

  async clickXPath(page, xpath, opts = {}) {
    const timeout = opts.timeout || 20000;
    const visible = opts.visible || true;

    try {
      const el = await this.waitForXPathEl(page, xpath, { timeout, visible });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await el.click();
      await el.dispose();
    } catch (error) {
      throw new Error(
        `Failed to click element with XPath: ${xpath}. Error: ${error.message}`,
      );
    }
  },

  // click xPath in a handle
  async waitForXPathIn(handle, xpath, timeout = 1000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const el = await handle.$(`xpath/${xpath}`);
      if (el) return el;

      await new Promise((r) => setTimeout(r, 200));
    }

    throw new Error("Timeout waiting for element inside handle 1");
  },

  async clickXPathIn(handle, xpath, timeout = 1000) {
    try {
      const el = await this.waitForXPathIn(handle, xpath, timeout);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await el.click();
      await el.dispose();
    } catch (error) {
      throw new Error(
        `Failed to click element with XPath inside handle: ${xpath}. Error: ${error.message}`,
      );
    }
  },

  async textXPathIn(handle, xpath, timeout = 1000) {
    try {
      const el = await this.waitForXPathIn(handle, xpath, timeout);
      const text = await el.evaluate((el) => el.innerText.trim() || "", el);
      await el.dispose();
      return text.trim();
    } catch (error) {
      throw new Error(
        `Failed to get text from element with XPath inside handle: ${xpath}. Error: ${error.message}`,
      );
    }
  },
  /**
   * Wait + get textContent
   */
  async textXPath(page, xpath, opts = {}) {
    const timeout = opts.timeout || 20000;
    const visible = opts.visible || true;
    try {
      const el = await this.waitForXPathEl(page, xpath, { timeout, visible });
      const text = await page.evaluate((node) => node.textContent || "", el);
      await el.dispose();
      return text.trim();
    } catch (error) {
      throw new Error(
        `Failed to get text from element with XPath: ${xpath}. Error: ${error.message}`,
      );
    }
  },

  /**
   * Get all matching elements by XPath (returns array of ElementHandles)
   */
  async getAllXPathEl(page, xpath, opts = {}) {
    const timeout = opts.timeout || 20000;
    try {
      await page.waitForSelector(`xpath/${xpath}`, { timeout });
      const handles = await page.$$(`xpath/${xpath}`);
      return handles; // already an array
    } catch (error) {
      throw new Error(
        `Failed to find elements with XPath: ${xpath}. Error: ${error.message}`,
      );
    }
  },

  async openBrowser(url) {
    try {
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
      return { browser, page };
    } catch (error) {
      throw new Error(
        `❌ Failed to open browser or navigate: ${error.message}`,
      );
    }
  },

  async goto(page, url, options = {}) {
    try {
      await page.goto(url, options);
      console.log(`\n✅ Navigation successful: ${url}\n`);
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

  async type(page, selector, text, options = {}) {
    console.log(`✍️  Typing into: ${selector}`);

    try {
      await page.type(selector, text, options);
      console.log(`✅ Typed successfully into: ${selector}`);
    } catch (error) {
      console.log(`❌ Failed to type into: ${selector}`);
      throw error;
    }
  },

  async waitForNavigation(page, options = {}) {
    console.log(`⏳ Waiting for navigation...`);

    try {
      await page.waitForNavigation(options);
      console.log(`✅ Navigation completed`);
    } catch (error) {
      console.log(`❌ Navigation timeout or failed`);
      throw error;
    }
  },

  async autoScroll(page, options = {}) {
    const duration = options.duration || 5000; // total scroll time (ms)
    const interval = options.interval || 200; // delay between scrolls (ms)
    const step = options.step || 300; // pixels per scroll
    const scrollBackToTop = options.scrollBackToTop ?? true;

    console.log(`📜 Auto-scrolling for ${duration}ms...`);

    let elapsed = 0;

    while (elapsed < duration) {
      await page.evaluate((scrollStep) => {
        window.scrollBy(0, scrollStep);
      }, step);

      await new Promise((resolve) => setTimeout(resolve, interval));
      elapsed += interval;
    }

    if (scrollBackToTop) {
      console.log("⬆️  Scrolling back to top...");
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  },

  // browser related helpers
  async alwaysStayInPage(browser, page) {
    try {
      browser.on("targetcreated", async (target) => {
        const newPage = await target.page();
        if (newPage && newPage !== page) {
          console.log("🗑️  Closing popup/redirect tab...");
          await newPage.close();
        }
      });
    } catch (error) {
      throw new Error(`❌ Failed to set up alwaysStayInPage: ${error.message}`);
    }
  },

  async acceptDialogs(page) {
    page.on("dialog", async (dialog) => {
      console.log(`💬 Dialog detected: ${dialog.message()}`);
      try {
        if (
          dialog
            .message()
            .toLowerCase()
            .includes("discard your message without sending.")
        ) {
          await dialog.accept();
          console.log("✅ Dialog accepted");
        }
      } catch (error) {
        console.log(`❌ Failed to accept dialog: ${error.message}`);
        throw new Error(`❌ Failed to accept dialog: ${error.message}`);
      }
    });
  },
  
  async tryCatch(action, keyword) {
    try {
      return await action();
    } catch (error) {
      console.log(`no ${keyword} is found`);
      return null;
    }
  },
};
