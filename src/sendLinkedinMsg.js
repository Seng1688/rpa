import { setTimeout } from "node:timers/promises";
import { PageHelper } from "../utility/pageHelper.js";
import Sel from "../utility/xpathContructor.js";
import { fail } from "node:assert";
import { Page } from "puppeteer";
const sel = new Sel();
const selChild = new Sel(true);

let config = {
  username: "wengyan.oo@ant-intl.com",
  password: "Yan888888.",
};
const SHORT_TIME_OUT = 3000; // 3 seconds for quick waits
const LONG_TIME_OUT = 20000; // 20 seconds for longer waits
const SENSITIVE_KEYWORDS = ["ant", "Audit and Assurance at Deloitte"];
let successSend = [];
let skipSend = [];
let _browser = null;
let _page = null;
async function login(page) {
  try {
    console.log("🔐 Checking if login is required...");
    const usernameInput = await PageHelper.waitForXPathEl(
      page,
      sel.id("username"),
      { timeout: SHORT_TIME_OUT, visible: true },
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
      await PageHelper.clickXPath(page, sel.id("password"));
      await page.keyboard.press("Backspace"); // Clear the field
      await PageHelper.type(page, "#password", config.password, { delay: 100 });

      // Click submit button
      console.log("🖱️  Clicking Sign in button...");
      await PageHelper.clickXPath(page, sel.buttonType("submit"));
      console.log("⏳ Waiting for login to complete...");
      await PageHelper.waitForNavigation(page, {
        waitUntil: "networkidle2",
        timeout: LONG_TIME_OUT,
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
export async function sendMessageToFirstPerson(openBrowser) {
  try {
    // Open URL and login
    const url =
      "https://www.linkedin.com/talent/search?searchContextId=87996147-4e3c-484f-b689-32f1acf06401&searchHistoryId=20706283793&searchRequestId=569febd5-9b10-4421-83c4-75226a2f3137&start=0&uiOrigin=PAGINATION";
    const { browser, page } = await PageHelper.openBrowser(url);
    _browser = browser;
    _page = page;

    await PageHelper.acceptDialogs(page);
    // await login(page);

    console.log("⏳ Waiting for contract list...");
    await PageHelper.tryCatch(
      () =>
        PageHelper.clickXPath(
          page,
          sel.attr(
            "button",
            "data-live-test-contract-select",
            "AntFin - Recruiter",
          ),
          { timeout: SHORT_TIME_OUT },
        ),
      "contract list",
    );

    const run = async () => {
      console.log("⏳ Waiting for simple-form...");
      await PageHelper.waitForXPathEl(
        page,
        sel.tagByClass("form", "simple-form"),
      );
      // await PageHelper.autoScroll(page);

      console.log(
        "🔍 Counting article elements with data-test-row attribute...",
      );
      // Get ALL card elements
      let articles = await PageHelper.getAllXPathEl(
        page,
        sel.attr("article", "data-test-row", ""),
      );

      console.log(`✅ Found ${articles.length} article(s)`);

      for (let i = 0; i < articles.length; i++) {
        console.log(
          `\n📄 Processing article ${i + 1} of ${articles.length}...`,
        );
        try {
          const article = articles[i];
          const username = await PageHelper.textXPathIn(
            article,
            selChild.attr("a", "data-test-link-to-profile-link", "true"),
          );

          // Click Show All
          await PageHelper.tryCatch(
            () =>
              PageHelper.clickXPathIn(
                article,
                selChild.attr("button", "data-test-expandable-list-button", ""),
              ),
            "Show All button",
          );

          // Get Experience block
          const experienceBlock = await article.evaluateHandle((el) => {
            return Array.from(
              el.querySelectorAll("ol.history-group__list-items"),
            );
          });
          // Convert JSHandle to array of ElementHandles
          const properties = await experienceBlock.getProperties();
          const experienceHandles = [];
          for (const property of properties.values()) {
            const handle = property.asElement();
            if (handle) experienceHandles.push(handle);
          }

          // Check Sensitive Words
          const hasSensitiveWords = await experienceHandles[0].evaluate(
            (el, keywords) => {
              const text = el.innerText.trim().toLowerCase();
              return keywords.some((word) => {
                const lowerWord = word.toLowerCase();
                if (/^[a-z\\s]+$/.test(lowerWord)) {
                  return new RegExp(`\\b${lowerWord}\\b`, "i").test(text);
                }
                return text.includes(lowerWord);
              });
            },
            SENSITIVE_KEYWORDS,
          );

          if (hasSensitiveWords) {
            skipSend.push(username);
            console.log(
              "✅ Found sensitive keyword, skipping to next article...",
            );
            continue;
          }
          console.log(
            "⚠️  No sensitive keyword found, preparing to send message...",
          );

          // Message Button
          console.log("🔍 Looking for message button...");
          const messageButton = await article.$(
            'button[data-test-component="message-icon-btn"]',
          );

          if (!messageButton) {
            console.log("⚠️  Message button not found in this article.");
            continue;
          }
          await setTimeout(SHORT_TIME_OUT);

          console.log("🖱️  Clicking message button...");
          await messageButton.click();

          // Wait Side Panel
          console.log("⏳ Waiting for side panel to load...");
          await PageHelper.waitForXPathEl(
            page,
            sel.tagByClass("div", "header-actions"),
          );

          // Dismiss button
          console.log("🔍 Looking for dismiss button...");
          await PageHelper.clickXPath(
            page,
            sel.attr("button", "aria-label", "Dismiss composer"),
          );
          successSend.push(username);
          console.log("✅ Article processed successfully!");
        } catch (error) {
          console.error(`❌ Error processing article ${i + 1}:`, error.message);
          throw error;
        }
      }

      // Click next Button
      const nextButton = await PageHelper.tryCatch(
        () =>
          PageHelper.waitForXPathEl(
            page,
            sel.attr("a", "data-live-test-pagination-next", ""),
          ),
        "Next button",
      );
      if (nextButton) {
        console.log("🖱️  Clicking next button...");
        await setTimeout(SHORT_TIME_OUT);
        // scroll to next button
        await nextButton.click();
        console.log("⏳ Waiting for next page to load...");
        await PageHelper.waitForNavigation(page, {
          waitUntil: "networkidle2",
          timeout: LONG_TIME_OUT,
        });
        // wait for navigation to complete
        console.log("⏳ Running next page...");

        await run();
      } else {
        console.log("✅ No next button found, reached end of results.");
      }
    };
    await run();
  } catch (error) {
    console.error("❌ Error during message automation:", error);
  } finally {
    console.log("\n✨ All articles processed!");

    // Keep browser open
    console.log("⏳ Keeping browser open...");
    await setTimeout(SHORT_TIME_OUT);
    if (_browser) {
      await _browser.close();
      console.log("🔚 Browser closed.");
    }
    console.log("Sucessfully sent list:");
    console.log(successSend);
    console.log("Skipped to send list:");
    console.log(skipSend);
  }
}
