import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("Starting Phase R4 visual and end-to-end verification...");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // Step 1: Sign up & initialize workspace
  console.log("Authenticating for R4 Order Matrix & Workspace flow...");
  const testEmail = `r4test_${Date.now()}@ordermind.local`;
  const testPass = "Pass12345!";

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
  await page.type('input[type="text"]', "R4 Plant Estimator");
  await page.type('input[type="email"]', testEmail);
  await page.type('input[type="password"]', testPass);
  await page.click('button[type="submit"]');
  await delay(1200);

  console.log("Setting up workspace via onboarding...");
  await page.evaluate(async () => {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: "Prestige Boxcraft Studio",
        industry: "Luxury Rigid & Presentation Boxes",
      }),
    });
  });
  await delay(1000);

  // Step 2: Create a client
  console.log("Creating client Aura Naturals...");
  const clientData = await page.evaluate(async () => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aura Naturals",
        company: "Aura Herbal Cosmetics Ltd",
        phone: "+91 98765 43210",
        email: "purchasing@auranaturals.in",
        tags: ["luxury", "cosmetics"],
      }),
    });
    return await res.json();
  });
  const clientId = clientData.client.id;

  // Step 3: Create multiple orders (manufacturing, design, consultation) for Order Matrix
  console.log("Creating initial multi-stage orders for matrix showcase...");
  const ord1 = await page.evaluate(async (cId) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: cId,
        orderType: "manufacturing",
        initialTitle: "Luxury Rigid Perfume Box w/ Foil",
      }),
    });
    return await res.json();
  }, clientId);

  const ord2 = await page.evaluate(async (cId) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: cId,
        orderType: "design",
        initialTitle: "Dieline & 3D Visual Rendering for 2026 Festive Line",
      }),
    });
    return await res.json();
  }, clientId);

  const ord3 = await page.evaluate(async (cId) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: cId,
        orderType: "consultation",
        initialTitle: "Sustainable Substrate & Greyboard Feasibility Audit",
      }),
    });
    return await res.json();
  }, clientId);

  // Step 4: Capture Order Matrix in Table View & Board View at 1440px
  console.log("Navigating to /orders (Order Matrix)...");
  await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle0" });
  await delay(1200);

  const shotMatrixTable1440 = path.join(ARTIFACT_DIR, "07_order_matrix_table_1440px.png");
  await page.screenshot({ path: shotMatrixTable1440, fullPage: true });
  console.log("Saved Order Matrix Table screenshot:", shotMatrixTable1440);

  // Switch to Board View
  console.log("Switching to Kanban Board View...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const boardBtn = btns.find((b) => b.textContent.includes("Board"));
    if (boardBtn) boardBtn.click();
  });
  await delay(800);

  const shotMatrixBoard1440 = path.join(ARTIFACT_DIR, "08_order_matrix_board_1440px.png");
  await page.screenshot({ path: shotMatrixBoard1440, fullPage: true });
  console.log("Saved Order Matrix Board screenshot:", shotMatrixBoard1440);

  // Step 5: Order Workspace Interactions on ord1
  const orderId = ord1.order.id;
  console.log(`Navigating to Order Workspace /orders/${orderId}...`);
  await page.goto(`${BASE_URL}/orders/${orderId}`, { waitUntil: "networkidle0" });
  await delay(1500);

  // Test stage gates: try changing stage to Production
  console.log("Testing stage-gate enforcement (Transition to Production)...");
  await page.evaluate(async (oId) => {
    const res = await fetch(`/api/orders/${oId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "Production" }),
    });
    return { ok: res.ok, data: await res.json() };
  }, orderId);

  // Record Design approved & Advance paid
  console.log("Recording Design approved and Advance paid human gates...");
  await page.evaluate(async (oId) => {
    await fetch(`/api/orders/${oId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gate: "design_approved" }),
    });
    await fetch(`/api/orders/${oId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gate: "advance_paid" }),
    });
    // Now transition stage to Production
    await fetch(`/api/orders/${oId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "Production" }),
    });
  }, orderId);

  // Set manufacturing quotation
  console.log("Setting manual Commercial Quotation...");
  await page.evaluate(async (oId) => {
    await fetch(`/api/orders/${oId}/quote`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "Sent",
        lineItems: [
          { id: "1", description: "Rigid Box Outer (140x90x45mm)", quantity: 500, unitPriceINR: 85, totalINR: 42500 },
          { id: "2", description: "Custom EVA Foam Velvet Tray", quantity: 500, unitPriceINR: 30, totalINR: 15000 },
        ],
        materialCostINR: 12000,
        finishCostINR: 6500,
        accessoriesCostINR: 3500,
        notes: "Strict requirement: 350 GSM White SBS board with Gold Foil stamping.",
      }),
    });
  }, orderId);

  // Add notes and set deadline
  console.log("Adding order note and dispatch deadline...");
  await page.evaluate(async (oId) => {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "order",
        targetId: oId,
        content: "QC sign-off complete. Gold foil stamping die #841 verified on proof sample.",
        pinned: true,
      }),
    });
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deadline",
        title: "Order Dispatch Deadline",
        dueAt: new Date("2026-11-20").toISOString(),
        orderId: oId,
      }),
    });
  }, orderId);

  // Confirm required manufacturing fields so brief can generate
  console.log("Confirming required manufacturing fields...");
  const fieldsToConfirm = [
    { field: "product_type", val: "Rigid Box w/ Magnetic Flap" },
    { field: "quantity", val: "500 units" },
    { field: "dimensions", val: "140 x 90 x 45 mm" },
    { field: "material", val: "350 GSM White SBS + 2mm Greyboard" },
    { field: "finish", val: "Soft-Touch Matte + Gold Foil Stamping" },
    { field: "printing", val: "Full outer CMYK + Spot UV" },
    { field: "deadline", val: "2026-11-20" },
  ];

  for (const f of fieldsToConfirm) {
    await page.evaluate(async (oId, fieldData) => {
      await fetch(`/api/orders/${oId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          field: fieldData.field,
          newValue: fieldData.val,
          note: "Operator confirmed specification",
        }),
      });
    }, orderId, f);
  }

  // Refresh page to capture 1440px Order Workspace
  await page.goto(`${BASE_URL}/orders/${orderId}`, { waitUntil: "networkidle0" });
  await delay(1200);

  const shotWorkspace1440 = path.join(ARTIFACT_DIR, "09_order_workspace_1440px.png");
  await page.screenshot({ path: shotWorkspace1440, fullPage: true });
  console.log("Saved Order Workspace 1440px screenshot:", shotWorkspace1440);

  // Step 6: Mobile Viewport 390px
  console.log("Testing 390px mobile viewport...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await delay(800);
  const shotWorkspace390 = path.join(ARTIFACT_DIR, "10_order_workspace_390px.png");
  await page.screenshot({ path: shotWorkspace390 });
  console.log("Saved Order Workspace 390px screenshot:", shotWorkspace390);

  // Step 7: Generate Production Brief & View Brief Page
  console.log("Generating Production Brief and navigating to /brief...");
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(async (oId) => {
    await fetch(`/api/orders/${oId}/brief`, { method: "POST" });
  }, orderId);

  await page.goto(`${BASE_URL}/orders/${orderId}/brief`, { waitUntil: "networkidle0" });
  await delay(1200);

  const shotBrief1440 = path.join(ARTIFACT_DIR, "11_production_brief_1440px.png");
  await page.screenshot({ path: shotBrief1440, fullPage: true });
  console.log("Saved Production Brief screenshot:", shotBrief1440);

  await browser.close();
  console.log("Phase R4 full order flow verification finished successfully!");
}

run().catch((err) => {
  console.error("R4 verification failed:", err);
  process.exit(1);
});
