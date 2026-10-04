import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("Launching Chrome for visual verification...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // 1. /dev/components at 1440px
  console.log("Navigating to /dev/components at 1440px...");
  await page.setViewport({ width: 1440, height: 1800, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/dev/components`, { waitUntil: "networkidle0" });
  await delay(1000);
  const shot1440 = path.join(ARTIFACT_DIR, "dev_components_1440px.png");
  await page.screenshot({ path: shot1440, fullPage: true });
  console.log("Saved:", shot1440);

  // 2. /dev/components at 390px mobile
  console.log("Navigating to /dev/components at 390px mobile...");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto(`${BASE_URL}/dev/components`, { waitUntil: "networkidle0" });
  await delay(1000);
  const shot390 = path.join(ARTIFACT_DIR, "dev_components_390px.png");
  await page.screenshot({ path: shot390, fullPage: false });
  console.log("Saved:", shot390);

  // 3. /how-we-built at 1440px
  console.log("Navigating to /how-we-built...");
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/how-we-built`, { waitUntil: "networkidle0" });
  await delay(800);
  const shotHwb = path.join(ARTIFACT_DIR, "how_we_built_1440px.png");
  await page.screenshot({ path: shotHwb, fullPage: true });
  console.log("Saved:", shotHwb);

  await browser.close();
  console.log("All visual check screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error during visual check:", err);
  process.exit(1);
});
