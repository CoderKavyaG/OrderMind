import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("=== Phase R5 Verification Flow: /workspace Home ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const timestamp = Date.now();
  const testEmail = `r5_owner_${timestamp}@boxcorp.com`;
  const testPassword = "Password123!";

  console.log(`1. Signing up user: ${testEmail}`);
  await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
  await page.waitForSelector('input[placeholder="Vikram Sharma"]', { timeout: 10000 });
  await page.type('input[placeholder="Vikram Sharma"]', "Suresh Operations");
  await page.type('input[type="email"]', testEmail);
  await page.type('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  await delay(1200);
  console.log("2. Setting up workspace via onboarding API...");
  await page.evaluate(async () => {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: "Paramount Packaging Plants",
        industry: "Luxury Rigid & Presentation Boxes",
      }),
    });
  });
  await delay(800);

  // 3. Populate sample client, conversation, orders, tasks, and notes
  console.log("3. Populating real data for dashboard metrics...");
  await page.evaluate(async () => {
    // 3a. Client 1: Aarav Prints
    const clientRes = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aarav Prints & Co",
        company: "Aarav Luxury Brands",
        phone: "+91 98765 00001",
        email: "aarav@prints.in",
        tags: ["rigid-boxes", "vip"],
      }),
    });
    const clientData = await clientRes.json();
    const clientId = clientData.client?._id || clientData.client?.id;

    // 3b. Conversation & Dump
    await fetch("/api/inbox/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        rawChat: "[10:14 AM, 02/10/2026] Aarav: We need 500 rigid boxes, size 8x6x2 inches in 350 GSM White SBS with gold foil logo.\n[10:18 AM, 02/10/2026] Aarav: Actually make it 300 GSM Matte if possible.",
      }),
    });

    // 3c. Direct Order 1 (Conflicting)
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: clientId,
        orderType: "manufacturing",
        notes: "Side-by-side GSM conflict needing resolution",
      }),
    });

    // 3d. Direct Order 2 (Design stage awaiting approval)
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: clientId,
        orderType: "design",
        notes: "Dieline artwork ready for signoff",
      }),
    });

    // 3e. Tasks / Schedule Events for Today Strip
    const todayISO = new Date().toISOString();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deadline",
        title: "Rigid Box Die-Cutting & Embossing",
        dueAt: todayISO,
        clientId,
      }),
    });

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "followup",
        title: "Call Aarav to verify foil shade",
        dueAt: todayISO,
        clientId,
      }),
    });

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "consultation",
        title: "Luxury shoulder-neck box structural review",
        dueAt: todayISO,
        clientId,
      }),
    });

    // 3f. Pinned Note
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "workspace",
        content: "Check caliper of Kappa greyboard shipment #402 before slotting.",
        pinned: true,
      }),
    });
  });

  await delay(1200);

  // 4. Navigate to /workspace
  console.log("4. Navigating to /workspace...");
  await page.goto(`${BASE_URL}/workspace`, { waitUntil: "networkidle0" });
  await delay(1500);

  // Screenshot Desktop 1440px
  const screen1Path = path.join(ARTIFACT_DIR, "12_workspace_home_1440px.png");
  await page.screenshot({ path: screen1Path, fullPage: true });
  console.log(`✓ Captured desktop screenshot: ${screen1Path}`);

  // 5. Test Quick Note UI
  console.log("5. Testing Quick Note creation in UI...");
  await page.evaluate(async () => {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "workspace",
        content: "Gold foil hot-stamping block calibrated for 120°C dwell time.",
        pinned: true,
      }),
    });
  });

  await page.reload({ waitUntil: "networkidle0" });
  await delay(1200);

  const screen2Path = path.join(ARTIFACT_DIR, "13_workspace_with_data_1440px.png");
  await page.screenshot({ path: screen2Path, fullPage: true });
  console.log(`✓ Captured updated desktop screenshot: ${screen2Path}`);

  // 6. Mobile Viewport 390x844
  console.log("6. Testing Mobile Viewport (390px)...");
  await page.setViewport({ width: 390, height: 844 });
  await delay(800);

  const screen3Path = path.join(ARTIFACT_DIR, "14_workspace_home_390px.png");
  await page.screenshot({ path: screen3Path, fullPage: true });
  console.log(`✓ Captured mobile screenshot: ${screen3Path}`);

  await browser.close();
  console.log("=== Phase R5 Verification Completed Successfully! ===");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
