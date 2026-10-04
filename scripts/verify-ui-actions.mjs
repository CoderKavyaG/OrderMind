import puppeteer from "puppeteer-core";

const BASE_URL = "http://localhost:3005";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("=== UI Verification & Button Audit ===");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Fresh Signup
  const email = `clean_user_${Date.now()}@testplant.com`;
  console.log("1. Signing up fresh user:", email);
  await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle2" });
  await page.type("input[type='text']", "Operator Jane");
  await page.type("input[type='email']", email);
  await page.type("input[type='password']", "StrongPass123!");
  await page.click("button[type='submit']");
  await delay(2000);

  console.log("Current URL after signup:", page.url());

  // 2. Onboarding
  if (page.url().includes("/onboarding")) {
    console.log("2. Completing onboarding...");
    await page.type("input[placeholder*='Apex Packaging']", "Emerald Box Manufacturing");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const continueBtn = btns.find(b => b.textContent?.includes("Continue"));
      if (continueBtn) continueBtn.click();
    });
    await delay(1000);
    // Step 2 & 3
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const nextBtn = btns.find(b => b.textContent?.includes("Continue") || b.textContent?.includes("Launch"));
      if (nextBtn) nextBtn.click();
    });
    await delay(1000);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const launchBtn = btns.find(b => b.textContent?.includes("Launch Workspace") || b.textContent?.includes("Get Started"));
      if (launchBtn) launchBtn.click();
    });
    await delay(2500);
  }

  console.log("Current URL after onboarding:", page.url());

  // 3. Verify Inbox Empty State
  console.log("3. Verifying /inbox...");
  await page.goto(`${BASE_URL}/inbox`, { waitUntil: "networkidle2" });
  const inboxEmptyText = await page.evaluate(() => document.body.innerText);
  const hasEmptyChats = inboxEmptyText.includes("No conversations yet");
  console.log("Inbox has clean empty state:", hasEmptyChats);

  // 4. Verify Orders Empty State
  console.log("4. Verifying /orders...");
  await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2" });
  const ordersText = await page.evaluate(() => document.body.innerText);
  const hasEmptyOrders = ordersText.includes("No orders found");
  console.log("Orders has clean empty state:", hasEmptyOrders);

  // 5. Verify Customers Empty State
  console.log("5. Verifying /customers...");
  await page.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle2" });
  const custText = await page.evaluate(() => document.body.innerText);
  const hasEmptyCust = custText.includes("No customers found");
  console.log("Customers has clean empty state:", hasEmptyCust);

  // 6. Verify Memory Empty State
  console.log("6. Verifying /memory...");
  await page.goto(`${BASE_URL}/memory`, { waitUntil: "networkidle2" });
  const memText = await page.evaluate(() => document.body.innerText);
  const hasEmptyMem = memText.includes("No customer memory facts");
  console.log("Memory has clean empty state:", hasEmptyMem);

  await browser.close();
  console.log("=== UI Verification Complete ===");
}

run().catch(console.error);
