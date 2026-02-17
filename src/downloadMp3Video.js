import { setTimeout } from "node:timers/promises";
import { PageHelper } from "../utility/pageHelper.js";
import { sel } from "../utility/xpathContructor.js";

// Function: Download videos/audio from URLs
export async function downloadMp3Video() {
  try {
    // List of video URLs to process
    const videoLinks = [
      "https://www.youtube.com/watch?v=KZGWfHdfWQs&list=RDKZGWfHdfWQs&start_radio=1",
      "https://www.youtube.com/watch?v=kBIhqNT5gsE&list=RDEMGAWr7BflxQO2xSvmngzdbA&index=2",
      "https://www.youtube.com/watch?v=SWD5s8iZgCY&list=RDEMGAWr7BflxQO2xSvmngzdbA&index=5",
      // Add more URLs here
    ];
    console.log(`📋 Processing ${videoLinks.length} video(s)`);

    // Open URL and login
    const url = "https://v1.y2mate.nu/";
    const { browser, page } = await PageHelper.openBrowser(url);

    // Set up listener to close any new tabs that open (popups/redirects)
    browser.on("targetcreated", async (target) => {
      const newPage = await target.page();
      if (newPage && newPage !== page) {
        console.log("🗑️  Closing popup/redirect tab...");
        await newPage.close();
      }
    });

    for (let i = 0; i < videoLinks.length; i++) {
      const videoUrl = videoLinks[i];
      console.log(
        `\n🔄 Processing video ${i + 1} of ${videoLinks.length}: ${videoUrl}`,
      );

      await PageHelper.clickXPath(page, sel.id("video"), { timeout: 10000 });

      await PageHelper.evaluate(
        page,
        (url) => {
          const input = document.querySelector("#video");
          if (input) {
            input.value = url;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        },
        videoUrl,
      );

      const formatButton = await PageHelper.getXPathHandle(
        page,
        sel.id("format"),
        { timeout: 30000 },
      );
      const formatButtonText = formatButton.textContent || "";

      if (!formatButtonText.includes(".mp3")) {
        console.log("⚠️  Format is not .mp3, clicking to change...");
        await formatButton.click();
        await setTimeout(500);
      }
      await PageHelper.clickXPath(page, sel.buttonType("submit"), {
        timeout: 10000,
      });
      await PageHelper.clickXPath(page, sel.button("Download"), {
        timeout: 10000,
      });
      await PageHelper.clickXPath(page, sel.button("Next"), { timeout: 10000 });

      console.log(`✅ Video ${i + 1} download triggered!`);
    }

    console.log("\n✨ All videos processed successfully!");
    console.log("⏳ Keeping browser open for 5 seconds...");

    await setTimeout(5000);
  } catch (error) {
    console.error("❌ Error during video download automation:", error);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔚 Browser closed.");
    }
  }
}
