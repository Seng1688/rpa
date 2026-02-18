import { setTimeout } from "node:timers/promises";
import { PageHelper } from "../utility/pageHelper.js";
import Sel from "../utility/xpathContructor.js";
const sel = new Sel();
const selChild = new Sel(true);

// Function: Download videos/audio from URLs
export async function downloadMp3Video() {
  // List of video URLs to process
  let _browser = null;
  let _page = null;
  let retryCount = 0;
  const CLICK_TIMEOUT = 1000; // 1 second for click timeouts
  let toDownloadVideoLinks = [
    "https://www.youtube.com/watch?v=KZGWfHdfWQs&list=RDKZGWfHdfWQs&start_radio=1",
    "https://www.youtube.com/watch?v=kBIhqNT5gsE&list=RDEMGAWr7BflxQO2xSvmngzdbA&index=2",
    "https://www.youtube.com/watch?v=SWD5s8iZgCY&list=RDEMGAWr7BflxQO2xSvmngzdbA&index=5",
  ];
  console.log(`📋 Processing ${toDownloadVideoLinks.length} video(s)`);

  const run = async (videoLinks) => {
    const url = "https://v1.y2mate.nu/";
    const { browser, page } = await PageHelper.openBrowser(url);
    _browser = browser;
    _page = page;
    await PageHelper.alwaysStayInPage(browser, page);

    for (let i = 0; i < videoLinks.length; i++) {
      const videoUrl = videoLinks[i];
      console.log(
        `\n🔄 Processing video ${i + 1} of ${videoLinks.length}: ${videoUrl}`,
      );

      await PageHelper.clickXPath(page, sel.id("video"));

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

      const formatButton = await PageHelper.waitForXPathEl(
        page,
        sel.id("format"),
      );
      const formatButtonText = await PageHelper.textXPath(
        page,
        sel.id("format"),
      );
      if (!formatButtonText.includes(".mp3")) {
        console.log("⚠️  Format is not .mp3, clicking to change...");
        await setTimeout(CLICK_TIMEOUT);
        await formatButton.click();
        await setTimeout(CLICK_TIMEOUT);
      }
      await PageHelper.clickXPath(page, sel.buttonType("submit"));
      await PageHelper.clickXPath(page, sel.button("Download"));

      // REMOVE the link from the list after processing to avoid re-processing in case of errors
      toDownloadVideoLinks = toDownloadVideoLinks.filter(
        (link) => link !== videoUrl,
      );

      await PageHelper.clickXPath(page, sel.button("Next"));
      console.log(`✅ Video ${i + 1} download triggered!`);
    }

    console.log("\n✨ All videos processed successfully!");
    console.log("⏳ Keeping browser open for 5 seconds...");

    await setTimeout(5000);
    if (_browser) {
      //   await _browser.close();
      _browser = null;
      _page = null;
      console.log("🔚 Browser closed.");
    }
  };
  try {
    await run(toDownloadVideoLinks);
  } catch (error) {
    console.error("❌ Error during video download automation:", error);
    if (_browser) {
      await _browser.close();
      _browser = null;
      _page = null;
      console.log("🔚 Browser closed.");
    }
    if (retryCount < 3) {
      retryCount++;
      console.log(`🔄 Retrying... (${retryCount}/3)`);
      await run(toDownloadVideoLinks);
    }
  }
}
