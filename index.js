import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { downloadMp3Video } from "./src/downloadMp3Video.js";
import { sendMessageToFirstPerson } from "./src/sendLinkedinMsg.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Main execution
(async () => {
  console.log("🎬 Starting automation...");
  await sendMessageToFirstPerson();
  // await downloadMp3Video();
})();
