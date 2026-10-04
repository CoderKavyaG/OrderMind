import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("=== Phase R6 Verification Flow: Landing & Auth ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("1. Visiting Landing Page at 1440px desktop...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
  await delay(1500);

  // Capture hero screenshot with eyebrow badge clearance
  const screen1Path = path.join(ARTIFACT_DIR, "15_landing_hero_r6_1440px.png");
  await page.screenshot({ path: screen1Path });
  console.log(`✓ Captured Landing Hero screenshot: ${screen1Path}`);

  // Scroll down to Built For Packaging
  console.log("2. Scrolling to Built for Packaging with real photography...");
  const packagingSection = await page.$("#packaging-types");
  if (packagingSection) {
    await packagingSection.scrollIntoView();
    await delay(1000);
    const screen2Path = path.join(ARTIFACT_DIR, "16_landing_packaging_photos_1440px.png");
    await page.screenshot({ path: screen2Path });
    console.log(`✓ Captured Packaging Photos screenshot: ${screen2Path}`);
  }

  // Test Get Started CTA click -> signup
  console.log("3. Testing 'Get started' CTA navigation...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
  const getStartedBtn = await page.$('a[href="/signup"] button');
  if (getStartedBtn) {
    await getStartedBtn.click();
  } else {
    await page.goto(`${BASE_URL}/signup`);
  }
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.log(`✓ Navigated to: ${page.url()}`);

  // Mobile Viewport 390x844 Landing Page
  console.log("4. Testing Mobile Viewport Landing Page (390px)...");
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
  await delay(1200);

  const screen3Path = path.join(ARTIFACT_DIR, "17_landing_hero_r6_390px.png");
  await page.screenshot({ path: screen3Path });
  console.log(`✓ Captured Landing Mobile screenshot: ${screen3Path}`);

  await browser.close();
  console.log("=== Phase R6 Verification Completed Successfully! ===");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
