import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

async function verifyIshanVisual() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Logging in as ishan@inthebox.pack...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', "ishan@inthebox.pack");
  await page.type('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => window.location.pathname.includes("/workspace") || window.location.pathname.includes("/inbox"), { timeout: 15000 });

  console.log("Current URL:", page.url());
  await page.screenshot({ path: path.join(process.cwd(), "docs", "qa", "ishan_workspace_dashboard.png") });

  // Navigate to /inbox
  await page.goto(`${BASE_URL}/inbox`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(process.cwd(), "docs", "qa", "ishan_inbox.png") });

  // Navigate to /orders
  await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(process.cwd(), "docs", "qa", "ishan_orders.png") });

  // Navigate to /customers
  await page.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(process.cwd(), "docs", "qa", "ishan_customers.png") });

  // Navigate to /settings
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(process.cwd(), "docs", "qa", "ishan_settings.png") });

  console.log("✓ All Ishan Kumar dashboard screenshots captured successfully!");
  await browser.close();
}

verifyIshanVisual().catch((err) => {
  console.error("Visual verification failed:", err);
  process.exit(1);
});
