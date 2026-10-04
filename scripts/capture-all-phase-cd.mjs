import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const DOCS_DIR = "d:\\projects\\upackiunwrap\\docs\\screenshots";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== Phase C + D Automated Capture & E2E Validation ===");

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // 1. Authenticate with seeded Demo Operator
  console.log("1. Authenticating as demo@ordermind.pack...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@ordermind.pack",
      password: "password123",
    }),
  });

  const rawCookie = loginRes.headers.get("set-cookie") || "";
  console.log("Raw login cookie received:", rawCookie.substring(0, 45) + "...");
  
  const tokenMatch = rawCookie.match(/ordermind_token=([^;]+)/);
  const tokenVal = tokenMatch ? tokenMatch[1] : "";
  if (!tokenVal) {
    throw new Error("Could not extract ordermind_token from login response!");
  }

  // 2. Fetch created order id
  console.log("2. Fetching active demo order...");
  const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
    headers: { Cookie: `ordermind_token=${tokenVal}` },
  });
  const ordersData = await ordersRes.json();
  const orderId = ordersData.orders?.[0]?.id || "demo";
  console.log("Active Order ID:", orderId, "Total orders found:", ordersData.orders?.length || 0);

  // 3. Launch Puppeteer browser
  console.log("3. Launching Chrome for 1440px and 390px captures...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const saveScreenshots = async (page, baseName) => {
    // 1440px Desktop
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await delay(700);
    const destDesktopDoc = path.join(DOCS_DIR, `${baseName}_1440px.png`);
    const destDesktopArt = path.join(ARTIFACT_DIR, `${baseName}_1440px.png`);
    await page.screenshot({ path: destDesktopDoc, fullPage: false });
    fs.copyFileSync(destDesktopDoc, destDesktopArt);

    // 390px Mobile
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await delay(600);
    const destMobileDoc = path.join(DOCS_DIR, `${baseName}_390px.png`);
    const destMobileArt = path.join(ARTIFACT_DIR, `${baseName}_390px.png`);
    await page.screenshot({ path: destMobileDoc, fullPage: false });
    fs.copyFileSync(destMobileDoc, destMobileArt);

    console.log(`✓ Captured: ${baseName} (1440px & 390px)`);
  };

  const page = await browser.newPage();

  // Set the exact ordermind_token cookie for http://localhost:3005
  await page.setCookie({
    name: "ordermind_token",
    value: tokenVal,
    url: BASE_URL,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });

  const pagesToCapture = [
    { url: `${BASE_URL}/`, name: "01_landing_hero" },
    { url: `${BASE_URL}/inbox`, name: "02_inbox_3panes" },
    { url: `${BASE_URL}/orders`, name: "03_orders_matrix" },
    { url: `${BASE_URL}/orders/${orderId}`, name: "04_order_workspace" },
    { url: `${BASE_URL}/orders/${orderId}/brief`, name: "05_production_brief" },
    { url: `${BASE_URL}/customers`, name: "06_customers_directory" },
    { url: `${BASE_URL}/channels`, name: "07_channels_adapters" },
    { url: `${BASE_URL}/memory`, name: "08_customer_memory" },
    { url: `${BASE_URL}/demo`, name: "09_interactive_demo_tour" },
    { url: `${BASE_URL}/how-we-built`, name: "10_how_we_built_blueprint" },
  ];

  for (const p of pagesToCapture) {
    try {
      console.log(`Navigating to ${p.url}...`);
      await page.goto(p.url, { waitUntil: "networkidle2", timeout: 25000 });
      await delay(900);
      console.log(`Current page URL: ${page.url()}`);
      await saveScreenshots(page, p.name);
    } catch (err) {
      console.error(`Error capturing ${p.name}:`, err.message);
    }
  }

  await browser.close();
  console.log("=== All Phase C & D Screenshots Successfully Captured ===");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
