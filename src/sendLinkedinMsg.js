import { setTimeout } from "node:timers/promises";
import { PageHelper } from "../utility/pageHelper.js";
import { sel } from "../utility/xpathContructor.js";

// Function: Send message to first person in search results
export async function sendMessageToFirstPerson(openBrowser) {
  let browser;
  try {
    // Open URL and login
    const url =
      "https://www.linkedin.com/talent/search?searchContextId=87996147-4e3c-484f-b689-32f1acf06401&searchHistoryId=20706283793&searchRequestId=569febd5-9b10-4421-83c4-75226a2f3137&start=0&uiOrigin=PAGINATION";
    const { browser, page } = await PageHelper.openBrowser(url);
    await PageHelper.acceptDialogs(page);
    // await login(page);

    console.log("⏳ Waiting for contract list...");
    let hasContractList = false;
    hasContractList = await PageHelper.clickXPath(
      page,
      sel.attr(
        "button",
        "data-live-test-contract-select",
        "AntFin - Recruiter",
      ),
      { timeout: 2000 },
    );

    console.log("⏳ Waiting for simple-form...");
    await PageHelper.waitForXPathEl(
      page,
      sel.tagByClass("form", "simple-form"),
      { timeout: 5000 },
    );
    // await PageHelper.autoScroll(page);

    // Get initial count of article elements with specific classes
    console.log("🔍 Counting article elements with data-test-row attribute...");

    let articles = await PageHelper.getAllXPathEl(
      page,
      sel.attr("article", "data-test-row", ""),
    );

    console.log(`✅ Found ${articles.length} article(s)`);

    // enhancement: select all select all button once and click them to expand all articles

    for (let i = 0; i < articles.length; i++) {
      console.log(`\n📄 Processing article ${i + 1} of ${articles.length}...`);
      try {
        const article = articles[i];

        // Check if any history-group contains a single word starting with 'ant'
        const hasSensitiveWords = await article.evaluate((el) => {
          const sensitiveList = ["ant", "alipay"];
          const text = el.innerText.toLowerCase();
          const words = text.split(/[\s,.\-;:()\[\]{}]+/);
          return words.some((word) => sensitiveList.includes(word));
        });

        if (hasSensitiveWords) {
          console.log(
            "✅ Found sensitive keyword, skipping to next article...",
          );
          continue;
        }
        console.log(
          "⚠️  No sensitive keyword found, preparing to send message...",
        );
        // Target the message button
        console.log("🔍 Looking for message button...");
        const messageButton = await article.$(
          'button[data-test-component="message-icon-btn"]',
        );

        if (!messageButton) {
          console.log("⚠️  Message button not found in this article.");
          continue;
        }
        await setTimeout(3000);

        // Click the message button
        console.log("🖱️  Clicking message button...");
        await messageButton.click();

        // Wait for the side panel to appear
        console.log("⏳ Waiting for side panel to load...");
        await PageHelper.waitForXPathEl(
          page,
          sel.tagByClass("div", "header-actions"),
          {
            timeout: 5000,
          },
        );

        // Find and click the dismiss button
        console.log("🔍 Looking for dismiss button...");
        const dismissButton = await PageHelper.waitForXPathEl(
          page,
          sel.attr("button", "aria-label", "Dismiss composer"),
          { timeout: 4500, visible: true },
        );
        if (dismissButton) {
          await setTimeout(3000);
          await dismissButton.click();
          await setTimeout(1000);
        } else {
          console.log("Dismiss button not found or not visible.");
        }
        console.log("✅ Article processed successfully!");
      } catch (error) {
        console.error(`❌ Error processing article ${i + 1}:`, error.message);
        continue;
      }
    }

    console.log("\n✨ All articles processed!");

    // Keep browser open
    console.log("⏳ Keeping browser open...");
    await setTimeout(5000);
  } catch (error) {
    console.error("❌ Error during message automation:", error);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔚 Browser closed.");
    }
  }
}

async function login(page) {
  try {
    let config = {
      username: "wengyan.oo@ant-intl.com",
      password: "Yan888888.",
    };
    console.log("🔐 Checking if login is required...");
    const usernameInput = await PageHelper.waitForXPathEl(
      page,
      sel.id("username"),
      { timeout: 4000 },
    );

    if (usernameInput) {
      console.log("🔑 Login page detected, logging in...");

      // Type username
      console.log("👤 Entering username...");
      usernameInput.focus();
      await page.keyboard.press("Backspace"); // Clear the field
      await PageHelper.type(page, "#username", config.username, { delay: 100 });

      // Type password
      console.log("🔒 Entering password...");
      await PageHelper.clickXPath(page, sel.id("password"), { timeout: 3000 });
      await page.keyboard.press("Backspace"); // Clear the field
      await PageHelper.type(page, "#password", config.password, { delay: 100 });

      // Click submit button
      console.log("🖱️  Clicking Sign in button...");
      await PageHelper.clickXPath(page, sel.buttonType("submit"), {
        timeout: 3000,
      });
      console.log("⏳ Waiting for login to complete...");
      await PageHelper.waitForNavigation(page, {
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