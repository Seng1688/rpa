const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { setTimeout } = require("node:timers/promises");

// Load configuration
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Common function: Open URL and login
async function openAndLogin(url) {
  console.log("🚀 Starting browser automation...");

  // Launch browser with a separate Chrome profile for automation
  const browser = await puppeteer.launch({
    headless: config.headless,
    defaultViewport: null,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    userDataDir: path.join(__dirname, "chrome-data"),
    args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  console.log(`📂 Navigating to: ${url}`);
  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Perform login if needed
  await login(page);

  console.log(`⏳ Waiting for page content to load...`);
  // Wait for search results to appear instead of fixed timeout
  //   await page.waitForSelector('div[data-view-name="people-search-result"]', {
  //     timeout: 30000
  //   });

  return { browser, page };
}

async function login(page) {
  try {
    console.log("🔐 Checking if login is required...");

    // Check if we're on a login page
    const usernameInput = await page.$("#username");

    if (usernameInput) {
      console.log("🔑 Login page detected, logging in...");

      // Type username
      console.log("👤 Entering username...");
      await page.click("#username", { clickCount: 3 }); // Select all existing text
      await page.keyboard.press("Backspace"); // Clear the field
      await page.type("#username", config.username, { delay: 100 });

      // Type password
      console.log("🔒 Entering password...");
      await page.click("#password", { clickCount: 3 }); // Select all existing text
      await page.keyboard.press("Backspace"); // Clear the field
      await page.type("#password", config.password, { delay: 100 });

      // Click submit button
      console.log("🖱️  Clicking Sign in button...");
      await page.click(
        'button[data-litms-control-urn="login-submit"][type="submit"]',
      );

      // Wait for navigation after login
      console.log("⏳ Waiting for login to complete...");
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      console.log("✅ Login successful!");
    } else {
      console.log("✅ Already logged in or no login required");
    }
  } catch (error) {
    console.log("⚠️  Login attempt completed (or not needed):", error.message);
  }
}

// Function: Send message to first person in search results
async function sendMessageToFirstPerson() {
  let browser;

  try {
    // Open URL and login
    const url =
      "https://www.linkedin.com/talent/search?searchContextId=87996147-4e3c-484f-b689-32f1acf06401&searchHistoryId=20706283793&searchRequestId=569febd5-9b10-4421-83c4-75226a2f3137&start=0&uiOrigin=PAGINATION";
    const result = await openAndLogin(url);
    browser = result.browser;
    const page = result.page;

    console.log("💼 Starting contract selection...");

    // Wait for contract list to load (5 second timeout)
    console.log("⏳ Waiting for contract list...");
    let hasContractList = false;
    try {
      await page.waitForSelector("div.contract-list__item", { timeout: 3000 });
      hasContractList = true;
    } catch (error) {
      console.log(
        "⚠️  No contract list found after 5 seconds, skipping contract selection...",
      );
    }

    // Only process contract selection if contract list exists
    if (hasContractList) {
      // Find the contract div with "AntFin - Recruiter" text
      console.log('🔍 Looking for "AntFin - Recruiter" contract...');
      const contractDiv = await page.evaluateHandle(() => {
        const contractItems = Array.from(
          document.querySelectorAll("div.contract-list__item"),
        );
        return contractItems.find((item) => {
          const nameElement = item.querySelector(
            "h3.contract-list__item-summary-name",
          );
          return (
            nameElement &&
            nameElement.textContent.trim() === "AntFin - Recruiter"
          );
        });
      });

      const contractElement = contractDiv.asElement();

      if (!contractElement) {
        console.log('⚠️  "AntFin - Recruiter" contract not found.');
      } else {
        console.log('✅ Found "AntFin - Recruiter" contract');

        // Find and click the Select button within this contract div
        console.log("🖱️  Clicking Select button...");
        const selectButton = await contractElement.$(
          "button[data-test-contract-select]",
        );

        if (!selectButton) {
          console.log("⚠️  Select button not found.");
        } else {
          await selectButton.click();
          console.log("✅ Contract selected successfully!");

          // Wait a moment for the selection to process and page to load
          await setTimeout(2000);
        }
      }
    }

    // Continue with article processing
    // Wait for the form with class="simple-form"
    console.log("⏳ Waiting for simple-form...");
    await page.waitForSelector("form.simple-form", { timeout: 30000 });

    // Scroll to bottom for 5 seconds to load all content
    console.log("📜 Scrolling to bottom for 5 seconds to load all articles...");
    const scrollDuration = 5000;
    const scrollInterval = 200;
    const scrollStep = 300;
    let scrollTime = 0;

    while (scrollTime < scrollDuration) {
      await page.evaluate((step) => {
        window.scrollBy(0, step);
      }, scrollStep);
      await setTimeout(scrollInterval);
      scrollTime += scrollInterval;
    }

    // Scroll back to top
    console.log("⬆️  Scrolling back to top...");
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await setTimeout(1000);

    // Get initial count of article elements with specific classes
    console.log("🔍 Counting article elements with data-test-row attribute...");
    let articleCount = await page.$$eval(
      "article[data-test-row]",
      (articles) => articles.length,
    );
    console.log(`✅ Found ${articleCount} article(s)`);

    for (let i = 0; i < articleCount; i++) {
      console.log(`\n📄 Processing article ${i + 1} of ${articleCount}...`);

      try {
        // Re-query articles each time to avoid stale element references
        const articles = await page.$$("article[data-test-row]");

        if (i >= articles.length) {
          console.log("⚠️  Article index out of bounds, stopping...");
          break;
        }

        const article = articles[i];

        // Check if there's a "Show all" button and click it
        const showAllButton = await article.evaluateHandle((el) => {
          const historyGroups = el.querySelectorAll("div.history-group");
          for (const group of historyGroups) {
            const spans = group.querySelectorAll("span");
            for (const span of spans) {
              if (span.textContent.trim().startsWith("Show all")) {
                return span.closest("button");
              }
            }
          }
          return null;
        });

        const showAllBtn = showAllButton.asElement();
        if (showAllBtn) {
          console.log("🖱️  Clicking 'Show all' button...");
          await showAllBtn.click();
          await setTimeout(2000); // Wait for content to expand
        }

        // Check if any history-group contains a single word starting with 'ant'
        const hasAntKeyword = await article.evaluate((el) => {
          const historyGroups = el.querySelectorAll("div.history-group");
          for (const group of historyGroups) {
            const text = group.textContent.toLowerCase();
            // Split by whitespace and punctuation to get individual words
            const words = text.split(/[\s,.\-;:()\[\]{}]+/);
            for (const word of words) {
              if (word.startsWith("ant") && word.length <= 10) {
                return true;
              }
            }
          }
          return false;
        });

        if (hasAntKeyword) {
          console.log("✅ Found 'ant' keyword, skipping to next article...");
          continue;
        }

        console.log("⚠️  No 'ant' keyword found, preparing to send message...");

        // Target the message button
        console.log("🔍 Looking for message button...");
        const messageButton = await article.$(
          'button[data-test-component="message-icon-btn"]',
        );

        if (!messageButton) {
          console.log("⚠️  Message button not found in this article.");
          continue;
        }

        // Click the message button
        console.log("🖱️  Clicking message button...");
        await messageButton.click();

        // Wait for the side panel to appear
        console.log("⏳ Waiting for side panel to load...");
        await page.waitForSelector("div.header-actions", { timeout: 10000 });

        // Wait a bit for the panel to fully render
        await setTimeout(1000);

        // Find and click the dismiss button
        console.log("🔍 Looking for dismiss button...");
        const dismissButton = await page.$(
          'button[aria-label="Dismiss composer"]',
        );

        if (!dismissButton) {
          console.log("⚠️  Dismiss button not found.");
          continue;
        }

        console.log("🖱️  Clicking dismiss button...");
        await dismissButton.click();

        // Wait for the panel to close
        console.log("⏳ Waiting for panel to close...");
        await setTimeout(1500);

        console.log("✅ Article processed successfully!");
      } catch (error) {
        console.error(`❌ Error processing article ${i + 1}:`, error.message);
        // Try to close any open panel before continuing
        try {
          const dismissBtn = await page.$(
            'button[aria-label="Dismiss composer"]',
          );
          if (dismissBtn) await dismissBtn.click();
        } catch (e) {
          // Ignore if dismiss button not found
        }
        continue;
      }
    }

    console.log("\n✨ All articles processed!");

    // Keep browser open
    console.log("⏳ Keeping browser open...");
    await setTimeout(5000);

    //   console.log("� Starting message automation...");

    //   // Step 1: Target the first div with data-view-name="people-search-result"
    //   console.log(
    //     '🔍 Finding first person with data-view-name="people-search-result"...',
    //   );
    //   const searchResultDiv = await page.$(
    //     'div[data-view-name="people-search-result"]',
    //   );

    //   if (!searchResultDiv) {
    //     console.log("⚠️  No search results found.");
    //     return;
    //   }

    //   // Step 2: Inside the targeted element, find the <span> with text 'Message'
    //   console.log("🔍 Looking for 'Message' button...");
    //   const messageSpan = await searchResultDiv.$(
    //     'xpath/.//span[text()="Message"]',
    //   );

    //   if (!messageSpan) {
    //     console.log("⚠️  Message button not found.");
    //     return;
    //   }

    //   // Step 3: Click the Message button
    //   console.log("🖱️  Clicking 'Message' button...");
    //   await messageSpan.click();

    //   await setTimeout(1000);

    //   const host = await page.$("#interop-outlet");
    //   if (!host) throw new Error("shadow host not found");

    //   const textboxHandle = await host.evaluateHandle((el) => {
    //     const root = el.shadowRoot;
    //     if (!root) return null;
    //     return root.querySelector('div[contenteditable="true"][role="textbox"]');
    //   });

    //   const textbox = textboxHandle.asElement();
    //   if (!textbox) throw new Error("textbox not found in shadow root");

    //   // Step 6: Click it and type 'hello'
    //   console.log("✍️  Typing message: 'hello'...");
    //   await textbox.click();
    //   await page.keyboard.type("hello", { delay: 100 });

    //   // Wait a moment for the send button to become enabled
    //   await setTimeout(1000);
    //   // ✅ send button (inside shadow root)
    //   const sendButtonHandle = await host.evaluateHandle((el) => {
    //     const root = el.shadowRoot;
    //     if (!root) return null;
    //     return root.querySelector("button.msg-form__send-button");
    //   });
    //   const sendButton = sendButtonHandle.asElement();
    //   if (!sendButton) throw new Error("send button not found in shadow root");

    //   // sometimes LinkedIn disables send until input registers
    //   await sendButton.click();
    //   console.log("✅ Message sent successfully!");

    //   // Keep browser open for a few seconds to see the results
    //   console.log("⏳ Keeping browser open for 3 seconds...");
    //   await setTimeout(3000);
  } catch (error) {
    console.error("❌ Error during message automation:", error);
  } finally {
    if (browser) {
      //   await browser.close();
      console.log("🔚 Browser closed.");
    }
  }
}

// Function: Download videos/audio from URLs
async function downloadVideos() {
  let browser;

  try {
    // List of video URLs to process
    const videoLinks = [
      "https://www.youtube.com/watch?v=KZGWfHdfWQs&list=RDKZGWfHdfWQs&start_radio=1",
      "https://www.youtube.com/watch?v=kBIhqNT5gsE&list=RDEMGAWr7BflxQO2xSvmngzdbA&index=2",
      "https://www.youtube.com/watch?v=SWD5s8iZgCY&list=RDEMGAWr7BflxQO2xSvmngzdbA&index=5",
      // Add more URLs here
    ];

    // Open URL and login
    const url = "https://v1.y2mate.nu/";
    const result = await openAndLogin(url);
    browser = result.browser;
    const page = result.page;

    // Set up listener to close any new tabs that open (popups/redirects)
    browser.on("targetcreated", async (target) => {
      const newPage = await target.page();
      if (newPage && newPage !== page) {
        console.log("🗑️  Closing popup/redirect tab...");
        await newPage.close();
      }
    });

    console.log("🎬 Starting video download automation...");
    console.log(`📋 Processing ${videoLinks.length} video(s)`);

    for (let i = 0; i < videoLinks.length; i++) {
      const videoUrl = videoLinks[i];
      console.log(
        `\n🔄 Processing video ${i + 1} of ${videoLinks.length}: ${videoUrl}`,
      );

      // Step 1: Wait for input with id 'video'
      console.log("⏳ Waiting for video input field...");
      await page.waitForSelector("#video", { timeout: 30000 });

      // Step 2: Click input
      console.log("🖱️  Clicking video input field...");
      await page.click("#video");

      // Step 3: Insert the URL (using paste for speed)
      console.log("📋 Pasting video URL...");
      await page.evaluate((url) => {
        const input = document.querySelector("#video");
        if (input) {
          input.value = url;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, videoUrl);

      // Step 4: Ensure the button with id="format" has text .mp3
      console.log("🔍 Checking format button...");
      const formatButton = await page.$("#format");
      if (formatButton) {
        const buttonText = await page.evaluate(
          (el) => el.textContent,
          formatButton,
        );
        console.log(`📝 Format button text: ${buttonText.trim()}`);

        if (!buttonText.includes(".mp3")) {
          console.log("⚠️  Format is not .mp3, clicking to change...");
          await formatButton.click();
          await setTimeout(500);
        } else {
          console.log("✅ Format is already .mp3");
        }
      }

      // Step 5: Wait for the Convert button
      console.log("⏳ Waiting for Convert button...");
      await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

      // Step 6: Click Convert button
      console.log("🖱️  Clicking Convert button...");
      await page.click('button[type="submit"]');

      // Step 7: Wait for the Download button
      console.log("⏳ Waiting for Download button...");
      await page.waitForSelector('button[type="button"]', {
        timeout: 60000,
        visible: true,
      });

      // Additional wait to ensure the download button is the right one
      const downloadButton = await page.evaluateHandle(() => {
        const buttons = Array.from(
          document.querySelectorAll('button[type="button"]'),
        );
        return buttons.find((btn) => btn.textContent.includes("Download"));
      });

      if (!downloadButton) {
        console.log(
          "⚠️  Download button not found, trying generic selector...",
        );
      }

      // Step 8: Click Download button
      console.log("🖱️  Clicking Download button...");
      await page.click('button[type="button"]');

      // Wait a moment for download to trigger and any popups to be closed
      await setTimeout(1500);

      console.log(`✅ Video ${i + 1} download triggered!`);

      // Check if main page URL changed and navigate back if needed
      const currentUrl = page.url();
      const expectedUrl = url;

      if (!currentUrl.startsWith(expectedUrl)) {
        console.log(`⚠️  Main page redirected to: ${currentUrl}`);
        console.log("🔄 Navigating back to main page...");

        // Navigate back to the main page
        await page.goto(expectedUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        console.log("✅ Back on main page");
      } else {
        console.log("✅ Still on correct page");
      }

      // Wait a bit before processing next video
      if (i < videoLinks.length - 1) {
        console.log("⏳ Waiting before next video...");
        await setTimeout(1000);

        // Click the "Next" button to reset for next video
        console.log("🖱️  Clicking Next button...");
        await page.waitForSelector('button[type="button"]', { timeout: 10000 });

        // Find and click the Next button specifically
        await page.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll('button[type="button"]'),
          );
          const nextButton = buttons.find((btn) =>
            btn.textContent.includes("Next"),
          );
          if (nextButton) nextButton.click();
        });

        // Wait for the video input field to be ready again
        console.log("⏳ Waiting for video input field to be ready...");
        await page.waitForSelector("#video", { timeout: 10000 });
        await setTimeout(500); // Small delay to ensure it's fully ready
      }
    }

    console.log("\n✨ All videos processed successfully!");

    // Keep browser open to see results
    console.log("⏳ Keeping browser open for 5 seconds...");
    await setTimeout(5000);
  } catch (error) {
    console.error("❌ Error during video download automation:", error);
  } finally {
    if (browser) {
      //   await browser.close();
      console.log("🔚 Browser closed.");
    }
  }
}

// Main execution
(async () => {
  const url = config.url;

  if (!url || url === "YOUR_URL_HERE") {
    console.error("❌ Error: Please set the URL in config.json");
    console.log('Update the "url" field in config.json with your target URL');
    process.exit(1);
  }

  // Choose which function to run:
  // Option 1: Click all like buttons
  // await clickAllLikeButtons();

  // Option 2: Send message to first person
  await sendMessageToFirstPerson();

  // Option 3: Download videos/audio
  // await downloadVideos();
})();
