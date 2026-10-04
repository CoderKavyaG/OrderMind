import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("Launching Chrome for landing page visual audit...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // 1. Landing page at 1440px (Hero Viewport)
  console.log("Navigating to / at 1440px (Hero Viewport)...");
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
  await delay(1200);
  const shotHero1440 = path.join(ARTIFACT_DIR, "landing_hero_1440px.png");
  await page.screenshot({ path: shotHero1440, fullPage: false });
  console.log("Saved:", shotHero1440);

  // 2. Landing page at 1440px (Full Page)
  console.log("Capturing full-page 1440px screenshot...");
  const shotFull1440 = path.join(ARTIFACT_DIR, "landing_full_1440px.png");
  await page.screenshot({ path: shotFull1440, fullPage: true });
  console.log("Saved:", shotFull1440);

  // 3. Landing page at 390px (Mobile Hero)
  console.log("Navigating to / at 390px mobile...");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
  await delay(1200);
  const shotMobile390 = path.join(ARTIFACT_DIR, "landing_mobile_390px.png");
  await page.screenshot({ path: shotMobile390, fullPage: false });
  console.log("Saved:", shotMobile390);

  await browser.close();
  console.log("Landing page visual screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error during visual check:", err);
  process.exit(1);
});
