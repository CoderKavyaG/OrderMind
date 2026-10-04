import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kavya\\.gemini\\antigravity-ide\\brain\\e63cb84a-33fb-4aa5-9802-dafea01eee70";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3005";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("Starting visual and end-to-end R2 verification...");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // Step 1: Sign up & initialize workspace
  console.log("Authenticating for R2 Client & Memory flow...");
  const testEmail = `r2test_${Date.now()}@ordermind.local`;
  const testPass = "Pass12345!";

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
  await page.type('input[type="text"]', "R2 Test Operator");
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

  // Step 2: Clients page at 1440px
  console.log("Navigating to /customers at 1440px...");
  await page.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle0" });
  await delay(1000);

  // Create a new client via modal or API
  console.log("Creating new client: Aura Naturals...");
  const clientData = await page.evaluate(async () => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aura Naturals",
        company: "Aura Herbal Cosmetics Ltd",
        phone: "+91 98765 43210",
        email: "purchasing@auranaturals.in",
        instagram: "@auranaturals",
        tags: ["luxury", "cosmetics", "gold-foil"],
        notes: "Strict requirement: 100% recycled SBS board with FSC certification.",
      }),
    });
    return await res.json();
  });
  console.log("Client created:", clientData.client?.id);

  // Refresh page to verify client card renders
  await page.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle0" });
  await delay(1000);
  const shotClients1440 = path.join(ARTIFACT_DIR, "04_clients_list_1440px.png");
  await page.screenshot({ path: shotClients1440 });
  console.log("Saved Clients list screenshot:", shotClients1440);

  // Navigate to Client Detail Page
  const clientId = clientData.client.id;
  console.log(`Navigating to /customers/${clientId}...`);
  await page.goto(`${BASE_URL}/customers/${clientId}`, { waitUntil: "networkidle0" });
  await delay(1200);

  // Step 3: Add Brand
  console.log("Adding Brand: Aura Botanica...");
  const brandData = await page.evaluate(async (cId) => {
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: cId,
        name: "Aura Botanica",
        notes: "Premium organic skincare range with gold hot stamping.",
      }),
    });
    return await res.json();
  });
  console.log("Brand created:", brandData.brand?.id);

  // Step 4: Add SKU
  console.log("Adding SKU: Rigid Perfume Box 100ml...");
  const skuData = await page.evaluate(async (bId) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: bId,
        name: "Rigid Perfume Box 100ml",
        structure: "Shoulder & Neck Box with Magnetic Flap",
        dimensions: "140 x 90 x 45 mm",
        materials: "350 GSM White SBS board + 2mm Greyboard core",
        finish: "Soft-Touch Matte Lamination + Gold Foil Stamping",
        accessories: "Custom EVA foam insert with velvet flocking",
        photos: [
          {
            id: "ref_photo_1",
            name: "Gold_Foil_Lid_Sample.jpg",
            url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&auto=format&fit=crop",
          },
        ],
      }),
    });
    return await res.json();
  });
  console.log("SKU created:", skuData.product?.id);

  // Step 5: Add Notes at Client Scope
  console.log("Adding Note at client scope...");
  await page.evaluate(async (cId) => {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "client",
        clientId: cId,
        title: "QC Color Target Sign-Off",
        content: "Pantone 871 C Gold Foil approved by design lead Aarav.",
        pinned: true,
      }),
    });
  }, clientId);

  // Step 6: Add Memory Fact & Verify It
  console.log("Adding Memory Fact: 'Always wants embossed gold logo on box top'...");
  const memData = await page.evaluate(async (cId, bId) => {
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: cId,
        brandId: bId,
        fact: "Always wants embossed gold logo on box top",
        kind: "preference",
        verified: false,
        source: { quote: "Please use the same embossed gold logo on top" },
      }),
    });
    return await res.json();
  }, clientId, brandData.brand?.id);

  const memoryId = memData.memory?.id;
  console.log("Created memory:", memoryId, "verified:", memData.memory?.verified);

  // Verify the memory fact via PATCH
  console.log("Verifying memory fact via PATCH...");
  await page.evaluate(async (mId) => {
    await fetch(`/api/memory/${mId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: true }),
    });
  }, memoryId);

  // Refresh client detail page to capture 1440px view
  await page.goto(`${BASE_URL}/customers/${clientId}`, { waitUntil: "networkidle0" });
  await delay(1200);

  // Switch to Memory tab to show verified badge in UI
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll("button"));
    const memTab = tabs.find((t) => t.textContent.includes("Memory Bank") || t.textContent.includes("Memory"));
    if (memTab) memTab.click();
  });
  await delay(600);

  const shotDetail1440 = path.join(ARTIFACT_DIR, "05_client_detail_1440px.png");
  await page.screenshot({ path: shotDetail1440, fullPage: true });
  console.log("Saved Client detail 1440px screenshot:", shotDetail1440);

  // Step 7: Mobile Viewport 390px
  console.log("Testing 390px mobile viewport...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await delay(600);
  const shotDetail390 = path.join(ARTIFACT_DIR, "06_client_detail_390px.png");
  await page.screenshot({ path: shotDetail390 });
  console.log("Saved Client detail 390px screenshot:", shotDetail390);

  // Step 8: Test Global Search
  console.log("Testing Global Search via API...");
  const searchAura = await page.evaluate(async () => {
    const res = await fetch("/api/search?q=Aura");
    return await res.json();
  });
  console.log("Global search results for 'Aura':", JSON.stringify(searchAura, null, 2));

  const searchMemory = await page.evaluate(async () => {
    const res = await fetch("/api/search?q=embossed");
    return await res.json();
  });
  console.log("Global search results for 'embossed':", JSON.stringify(searchMemory, null, 2));

  if (searchAura.results?.length === 0 || searchMemory.results?.length === 0) {
    throw new Error("Search did not find created client, brand, or memory!");
  }

  await browser.close();
  console.log("All R2 verifications and visual checks PASSED successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
