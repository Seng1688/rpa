import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PageHelper } from "./utility/pageHelper.js";
import { downloadMp3Video } from "./src/downloadMp3Video.js";
import { sendMessageToFirstPerson } from "./src/sendLinkedinMsg.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

async function login(page) {
  try {
    console.log("🔐 Checking if login is required...");

    // Check if we're on a login page
    const usernameInput = await PageHelper.getElement(page, "#username");

    if (usernameInput) {
      console.log("🔑 Login page detected, logging in...");

      // Type username
      console.log("👤 Entering username...");
      await PageHelper.click(page, "#username", { clickCount: 3 }); // Select all existing text
      await page.keyboard.press("Backspace"); // Clear the field
      await PageHelper.type(page, "#username", config.username, { delay: 100 });

      // Type password
      console.log("🔒 Entering password...");
      await PageHelper.click(page, "#password", { clickCount: 3 }); // Select all existing text
      await page.keyboard.press("Backspace"); // Clear the field
      await PageHelper.type(page, "#password", config.password, { delay: 100 });

      // Click submit button
      console.log("🖱️  Clicking Sign in button...");
      await PageHelper.click(
        page,
        'button[data-litms-control-urn="login-submit"][type="submit"]',
      );

      // Wait for navigation after login
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
// Main execution
(async () => {
  console.log("🎬 Starting automation...");
  // await sendMessageToFirstPerson();
  await downloadMp3Video();
})();
