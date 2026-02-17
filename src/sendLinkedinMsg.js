import { setTimeout } from "node:timers/promises";
import { PageHelper } from "../utility/pageHelper.js";

// Function: Send message to first person in search results
export async function sendMessageToFirstPerson(openBrowser) {
  let browser;
  try {
    // Open URL and login
    const url =
      "https://www.linkedin.com/talent/search?searchContextId=87996147-4e3c-484f-b689-32f1acf06401&searchHistoryId=20706283793&searchRequestId=569febd5-9b10-4421-83c4-75226a2f3137&start=0&uiOrigin=PAGINATION";
    const result = await PageHelper.openBrowser(url);
    browser = result.browser;
    const page = result.page;

    console.log("💼 Starting contract selection...");

    // Wait for contract list to load (5 second timeout)
    console.log("⏳ Waiting for contract list...");
    let hasContractList = false;
    try {
      await PageHelper.waitFor(page, "div.contract-list__item", {
        timeout: 3000,
      });
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
    await PageHelper.waitFor(page, "form.simple-form", { timeout: 30000 });

    // Scroll to bottom for 5 seconds to load all content
    console.log("📜 Scrolling to bottom for 5 seconds to load all articles...");
    const scrollDuration = 5000;
    const scrollInterval = 200;
    const scrollStep = 300;
    let scrollTime = 0;

    while (scrollTime < scrollDuration) {
      await PageHelper.evaluate(
        page,
        (step) => {
          window.scrollBy(0, step);
        },
        scrollStep,
      );
      await setTimeout(scrollInterval);
      scrollTime += scrollInterval;
    }

    // Scroll back to top
    console.log("⬆️  Scrolling back to top...");
    await PageHelper.evaluate(page, () => {
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
        const articles = await PageHelper.getElements(
          page,
          "article[data-test-row]",
        );

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
        await PageHelper.waitFor(page, "div.header-actions", {
          timeout: 10000,
        });

        // Wait a bit for the panel to fully render
        await setTimeout(1000);

        // Find and click the dismiss button
        console.log("🔍 Looking for dismiss button...");
        const dismissButton = await PageHelper.getElement(
          page,
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
          const dismissBtn = await PageHelper.getElement(
            page,
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
  } catch (error) {
    console.error("❌ Error during message automation:", error);
  } finally {
    if (browser) {
      //   await browser.close();
      console.log("🔚 Browser closed.");
    }
  }
}
