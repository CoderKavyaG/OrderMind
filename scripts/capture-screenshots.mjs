import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("Preparing authenticated session and data...");

  // 1. Signup fresh user session
  const email = `audit_${Date.now()}@packfirm.com`;
  const password = "Password123!";

  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Vikram Sharma (Apex Packaging)",
      email,
      password,
    }),
  });

  let cookie = signupRes.headers.get("set-cookie")?.split(";")[0] || "";

  // 2. Onboarding
  const onboardRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      businessName: "Apex Packaging Solutions",
      industry: "Packaging",
    }),
  });
  if (onboardRes.headers.get("set-cookie")) {
    cookie = onboardRes.headers.get("set-cookie").split(";")[0];
  }
  const tokenVal = cookie.replace("token=", "").split(";")[0];

  // 3. Customer
  const custRes = await fetch(`${BASE_URL}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Aarav Luxury Prints",
      company: "Aarav Prints LLC",
      phone: "+91 98111 22233",
      email: "orders@aaravprints.com",
    }),
  });
  const custData = await custRes.json();
  if (!custData.customer) {
    console.error("Customer creation failed:", custData);
    throw new Error("Customer creation failed: " + JSON.stringify(custData));
  }
  const customerId = custData.customer.id;

  // 4. Ingest Historical Confirmed Order
  const histChat = `[10/01/2026, 09:00:00 AM] Aarav: We need 500 rigid perfume boxes.
[10/01/2026, 09:05:00 AM] Aarav: Material should be 300 GSM Matte SBS board.
[10/01/2026, 09:10:00 AM] Aarav: Finish should be Matte Lamination with silver foil.`;

  const histImportRes = await fetch(`${BASE_URL}/api/inbox/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      title: "Previous Rigid Perfume Boxes (Delivered)",
      rawText: histChat,
    }),
  });
  const histImportData = await histImportRes.json();
  const histConvId = histImportData.conversationId;

  await fetch(`${BASE_URL}/api/conversations/${histConvId}/process`, {
    method: "POST",
    headers: { Cookie: cookie },
  });

  const histOrdersRes = await fetch(`${BASE_URL}/api/orders`, { headers: { Cookie: cookie } });
  const histOrdersData = await histOrdersRes.json();
  const histOrder = histOrdersData.orders?.find((o) => o.conversationId === histConvId);

  if (histOrder) {
    const histSpecs = [
      { field: "product_type", value: "Rigid Box" },
      { field: "quantity", value: 500 },
      { field: "dimensions", value: "150 x 100 x 50 mm" },
      { field: "material", value: "300 GSM Matte SBS board" },
      { field: "finish", value: "Matte Lamination with silver foil" },
      { field: "printing", value: "Solid Black with Silver" },
      { field: "deadline", value: "Delivered" },
    ];
    for (const s of histSpecs) {
      await fetch(`${BASE_URL}/api/orders/${histOrder.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ field: s.field, action: "edit", newValue: s.value }),
      });
    }
    await fetch(`${BASE_URL}/api/orders/${histOrder.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ action: "confirm_all", note: "Historical baseline" }),
    });
  }

  // 5. Ingest Active Multi-Modal Conversation
  const activeChat = `[02/02/2026, 10:00:00 AM] Aarav: Hi team! We need rigid presentation boxes for our new festive collection.
[02/02/2026, 10:02:00 AM] Aarav: Initial quantity: 500 units.
[02/02/2026, 10:03:00 AM] Aarav: Actually make that +200 extra boxes, so 700 total.
[02/02/2026, 10:04:00 AM] Aarav: Dimensions should be 220 x 150 x 60 mm. Make it a little taller, say 70mm height.
[02/02/2026, 10:05:00 AM] Aarav: For material, please keep same material as last time.
[02/02/2026, 10:10:00 AM] Aarav: Wait, for material let's make it 350 GSM Gloss Kappa board instead.
[02/02/2026, 10:12:00 AM] Aarav: Gold foil logo stamping on lid with soft-touch lamination.
[02/02/2026, 10:15:00 AM] Aarav: We need delivery strictly by Diwali deadline (Nov 10).`;

  const activeImportRes = await fetch(`${BASE_URL}/api/inbox/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      title: "Festive Rigid Boxes — Aarav Prints",
      rawText: activeChat,
    }),
  });
  const activeImportData = await activeImportRes.json();
  const activeConvId = activeImportData.conversationId;

  // Process Active Conversation
  console.log("Processing active conversation with Gemma Pipeline...");
  await fetch(`${BASE_URL}/api/conversations/${activeConvId}/process`, {
    method: "POST",
    headers: { Cookie: cookie },
  });

  // Get active order
  const activeOrdersRes = await fetch(`${BASE_URL}/api/orders`, { headers: { Cookie: cookie } });
  const activeOrdersData = await activeOrdersRes.json();
  const activeOrder = activeOrdersData.orders?.find((o) => o.conversationId === activeConvId);

  // Ingest Customer Memories
  await fetch(`${BASE_URL}/api/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      fact: "Customer insists on premium gold foil stamping with zero smudging on luxury rigid boxes.",
      kind: "preference",
      verified: true,
    }),
  });

  console.log("Launching Puppeteer for high-res screenshot capture...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  try {
    // 0. Landing Page Screenshot
    console.log("0. Capturing New Landing Page...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "00_landing_page.png") });

    // 1. Login Page Screenshot (before setting cookie)
    console.log("1. Capturing Redesigned Login Page...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "01_login_page.png") });

    // 1b. Onboarding Flow Step 1 & Step 2
    console.log("1b. Capturing 3-Step Guided Onboarding Flow...");
    // Create temporary session that needs onboarding
    const tempUserEmail = `onboard_${Date.now()}@packfirm.com`;
    const tempSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Rohit Mehta",
        email: tempUserEmail,
        password: "Password123!",
      }),
    });
    const tempCookieStr = tempSignupRes.headers.get("set-cookie") || "";
    const tempTokenMatch = tempCookieStr.match(/ordermind_token=([^;]+)/);
    const tempToken = tempTokenMatch ? tempTokenMatch[1] : "";
    if (tempToken) {
      await page.setCookie({
        name: "ordermind_token",
        value: tempToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    }
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "networkidle2" });
    await delay(1200);
    await page.type('input[placeholder*="Apex Packaging"]', "Mehta Luxury Cartons");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "01b_onboarding_step1.png") });

    // Click continue to step 2
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.includes("Continue to Substrates")
      );
      if (btn) btn.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "01c_onboarding_step2.png") });

    // Inject Main Workspace Cookie via browser cookie jar
    console.log("Setting auth cookie for workspace session...");
    const mainTokenMatch = cookie.match(/ordermind_token=([^;]+)/) || [null, tokenVal];
    const mainToken = mainTokenMatch[1];
    await page.setCookie({
      name: "ordermind_token",
      value: mainToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });

    // 1c. Capturing Cloned WORKSPACE Dashboard
    console.log("1c. Capturing Cloned WORKSPACE Dashboard...");
    await page.goto(`${BASE_URL}/workspace`, { waitUntil: "networkidle2" });
    await delay(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "00b_cloned_workspace_dashboard.png") });

    // 2. Inbox Thread & Claims
    console.log("2. Capturing Inbox Page & Thread...");
    await page.goto(`${BASE_URL}/inbox`, { waitUntil: "domcontentloaded" });
    await delay(1500);

    // Select the conversation
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div, button, p")).filter(
        (el) => el.textContent && el.textContent.includes("Festive Rigid Boxes")
      );
      if (items.length > 0) {
        (items[0].closest('[role="button"]') || items[0]).click();
      }
    });
    await delay(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "02_inbox_thread.png") });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "03_inbox_with_claims.png") });

    // 4. Orders List
    console.log("4. Capturing Orders List...");
    await page.goto(`${BASE_URL}/orders`, { waitUntil: "domcontentloaded" });
    await delay(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "04_orders_list.png") });

    // 5. Order Workspace
    if (activeOrder) {
      console.log(`5. Capturing Order Workspace (/orders/${activeOrder.id})...`);
      await page.goto(`${BASE_URL}/orders/${activeOrder.id}`, { waitUntil: "domcontentloaded" });
      try {
        await page.waitForSelector("table", { timeout: 8000 });
      } catch {
        await delay(3000);
      }
      await delay(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "05_order_workspace.png") });

      // Check conflict modal
      const conflictTrigger = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(
          (b) => b.textContent.includes("Resolve") || b.textContent.includes("CONFLICTING")
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (conflictTrigger) {
        await delay(1000);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "06_conflict_resolution.png") });
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find(
            (b) => b.textContent.includes("Close") || b.textContent.includes("Cancel")
          );
          if (btn) btn.click();
        });
        await delay(500);
      }

      // 6. Confirmed Production Brief
      console.log("6. Capturing Production Brief from confirmed order...");
      const briefTargetId = histOrder ? histOrder.id : activeOrder.id;
      await page.goto(`${BASE_URL}/orders/${briefTargetId}/brief`, { waitUntil: "domcontentloaded" });
      await delay(1500);

      // Click Generate if visible
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent.includes("Generate Production Brief") || b.textContent.includes("Generate")
        );
        if (btn) btn.click();
      });
      await delay(2500);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "07_production_brief.png") });
    }

    // 7. Customer Memory
    console.log("7. Capturing Customer Memory Dashboard...");
    await page.goto(`${BASE_URL}/memory`, { waitUntil: "domcontentloaded" });
    await delay(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "08_customer_memory.png") });

    // 8. Mobile 390px Viewports
    console.log("8. Capturing Mobile 390px Viewport (Inbox & Workspace)...");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.goto(`${BASE_URL}/inbox`, { waitUntil: "domcontentloaded" });
    await delay(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "09_mobile_390px_inbox.png") });

    if (activeOrder) {
      await page.goto(`${BASE_URL}/orders/${activeOrder.id}`, { waitUntil: "domcontentloaded" });
      await delay(1500);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "10_mobile_390px_order.png") });
    }

    console.log("SUCCESS: All master UI screenshots captured and saved to artifact directory!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
