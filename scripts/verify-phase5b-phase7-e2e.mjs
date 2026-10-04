const BASE_URL = "http://localhost:3005";

async function main() {
  console.log("==========================================================");
  console.log("=== Phase 5b & 7 End-to-End Live Integration Test ===");
  console.log("==========================================================");

  // 1. Sign up user
  const email = `phase5b7_tester_${Date.now()}@packco.com`;
  const password = "Password123!";

  console.log(`\n1. Creating user session for ${email}...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Packaging Tech Lead",
      email,
      password,
    }),
  });

  let cookie = signupRes.headers.get("set-cookie")?.split(";")[0] || "";
  console.log("Signup status:", signupRes.status);
  if (signupRes.status !== 200 && signupRes.status !== 201) {
    throw new Error(`Signup failed: ${await signupRes.text()}`);
  }

  // 2. Complete onboarding
  console.log("\n2. Completing Onboarding...");
  const onboardRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      businessName: "Luxe Carton & Rigid Works",
      industry: "Packaging",
    }),
  });
  if (onboardRes.headers.get("set-cookie")) {
    cookie = onboardRes.headers.get("set-cookie").split(";")[0];
  }
  console.log("Onboarding status:", onboardRes.status);

  // 3. Customer Memory API Verification
  console.log("\n3. Testing Customer Memory Endpoints...");
  // Create customer
  const custRes = await fetch(`${BASE_URL}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Saffron Fragrances Ltd",
      phone: "+91 99887 76655",
      email: "procurement@saffronfragrances.com",
    }),
  });
  const custData = await custRes.json();
  const customerId = custData.customer.id;
  console.log("Customer created:", customerId);

  // Create manual memory
  const memCreateRes = await fetch(`${BASE_URL}/api/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      fact: "Always uses hot foil gold stamping on exterior lid",
      kind: "preference",
      verified: false,
    }),
  });
  console.log("Create memory status:", memCreateRes.status);
  const memData = await memCreateRes.json();
  const memoryId = memData.memory.id;
  if (!memoryId || memData.memory.verified !== false) {
    throw new Error("Memory creation failed or verified is true by default");
  }

  // Toggle verify memory
  const verifyRes = await fetch(`${BASE_URL}/api/memory/${memoryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ verified: true }),
  });
  console.log("Verify memory toggle status:", verifyRes.status);
  const verifiedMem = await verifyRes.json();
  if (verifiedMem.memory.verified !== true) {
    throw new Error("Failed to verify customer memory");
  }

  // List customer memories
  const listMemRes = await fetch(`${BASE_URL}/api/memory?customerId=${customerId}`, {
    headers: { Cookie: cookie },
  });
  const listMemData = await listMemRes.json();
  console.log(`Fetched ${listMemData.memories.length} customer memories.`);
  if (listMemData.memories.length < 1) {
    throw new Error("Expected at least 1 memory in listing");
  }

  // 4. Voice Transcription & Ingestion
  console.log("\n4. Testing Voice Message Ingestion & STT Transcription Pipeline...");
  const chatText = `[02/02/2026, 10:00:00 AM] Saffron: We need rigid boxes for perfume bottles.
[02/02/2026, 10:02:00 AM] Saffron: <attached: voice_note_specs.mp3>`;

  const importRes = await fetch(`${BASE_URL}/api/inbox/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      title: "Saffron Fragrance Order",
      rawText: chatText,
    }),
  });
  const importData = await importRes.json();
  const convId = importData.conversationId;
  console.log("Conversation imported:", convId);

  // Fetch conversation messages
  const convDetailRes = await fetch(`${BASE_URL}/api/inbox/conversations/${convId}`, {
    headers: { Cookie: cookie },
  });
  const convDetail = await convDetailRes.json();
  const voiceMsg = convDetail.messages.find((m) => m.content.includes("voice_note") || m.type === "voice" || m.content.includes("<attached:"));
  if (!voiceMsg) {
    throw new Error("Voice note message not found in thread");
  }

  console.log("Transcribing voice message:", voiceMsg.id);
  const voiceTranscript = "Quantity is 2000 units, dimensions 120 x 80 x 40 mm, 350 GSM Gold foil board, matte finish, deliver by Next Friday.";
  const transcribeRes = await fetch(`${BASE_URL}/api/inbox/messages/${voiceMsg.id}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ manualText: voiceTranscript }),
  });
  console.log("Transcribe status:", transcribeRes.status);
  const transcribedData = await transcribeRes.json();
  if (transcribedData.message.type !== "voice" || !transcribedData.message.transcript) {
    throw new Error("Message was not updated to voice type with transcript");
  }
  console.log("Transcribed text stored:", transcribedData.message.transcript);

  // 5. Check Order Created from Extracted Voice Specs
  console.log("\n5. Checking Order State Engine Integration...");
  const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
    headers: { Cookie: cookie },
  });
  const ordersData = await ordersRes.json();
  const order = ordersData.orders.find((o) => o.conversationId === convId);
  if (!order) {
    throw new Error("Order was not automatically created for conversation");
  }
  console.log(`Order ${order.orderNumber} (ID: ${order.id}) status: ${order.status}`);

  // 6. Test Production Brief Generation Security Rule:
  // Generation MUST be strictly blocked unless status is CONFIRMED!
  console.log("\n6. Testing Production Brief Guardrails (Blocked when Unconfirmed)...");
  const blockedBriefRes = await fetch(`${BASE_URL}/api/orders/${order.id}/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  console.log("Attempted brief generation for unconfirmed order. Status:", blockedBriefRes.status);
  if (blockedBriefRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request for unconfirmed order brief, got ${blockedBriefRes.status}`);
  }
  const blockedBody = await blockedBriefRes.json();
  console.log("Guardrail error correctly returned:", blockedBody.error);

  // 7. Human confirms all required fields to reach CONFIRMED state
  console.log("\n7. Setting all required fields and confirming order...");
  const requiredFields = [
    { field: "product_type", value: "Rigid Box with Lid" },
    { field: "quantity", value: 2000 },
    { field: "dimensions", value: "120 x 80 x 40 mm" },
    { field: "material", value: "350 GSM Board" },
    { field: "finish", value: "Matte Lamination" },
    { field: "printing", value: "Gold Foil + CMYK" },
    { field: "deadline", value: "Next Friday" },
  ];

  for (const rf of requiredFields) {
    const editRes = await fetch(`${BASE_URL}/api/orders/${order.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        field: rf.field,
        action: "edit",
        newValue: rf.value,
        note: `Verified specification ${rf.field}`,
      }),
    });
    if (editRes.status !== 200) {
      console.warn(`Edit ${rf.field} failed:`, editRes.status, await editRes.text());
    }
  }

  // Confirm and lock all order specifications
  const confirmAllRes = await fetch(`${BASE_URL}/api/orders/${order.id}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "confirm_all",
      note: "All specifications verified and locked for manufacturing",
    }),
  });
  console.log("Confirm all status:", confirmAllRes.status);

  // Verify order is now CONFIRMED
  const confirmedOrderRes = await fetch(`${BASE_URL}/api/orders/${order.id}`, {
    headers: { Cookie: cookie },
  });
  const confirmedOrderData = await confirmedOrderRes.json();
  console.log("Updated order status:", confirmedOrderData.order.status);
  if (confirmedOrderData.order.status !== "CONFIRMED") {
    throw new Error(`Expected order to be CONFIRMED, got ${confirmedOrderData.order.status}`);
  }

  // 8. Generate Production Brief now that order is CONFIRMED
  console.log("\n8. Generating Production Brief for confirmed order...");
  const genBriefRes = await fetch(`${BASE_URL}/api/orders/${order.id}/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  console.log("Brief generation status:", genBriefRes.status);
  if (genBriefRes.status !== 200) {
    throw new Error(`Brief generation failed: ${await genBriefRes.text()}`);
  }
  const briefData = await genBriefRes.json();
  console.log("Production Brief successfully generated!");
  console.log("Product:", briefData.brief.content.productType);
  console.log("Quantity:", briefData.brief.content.quantity);
  console.log("Footer:", briefData.brief.content.footer);

  // 9. Fetch Brief with stale check
  console.log("\n9. Testing GET /api/orders/[id]/brief and Stale Detection...");
  const getBriefRes = await fetch(`${BASE_URL}/api/orders/${order.id}/brief`, {
    headers: { Cookie: cookie },
  });
  const getBriefData = await getBriefRes.json();
  console.log("Brief fetch status:", getBriefRes.status, "isStale:", getBriefData.brief?.isStale);
  if (getBriefData.brief?.isStale !== false) {
    throw new Error("Brief should not be stale immediately after generation");
  }

  // 10. Verify Production Brief printable page renders
  console.log("\n10. Testing Production Brief Page (/orders/[id]/brief)...");
  const briefPageRes = await fetch(`${BASE_URL}/orders/${order.id}/brief`, {
    headers: { Cookie: cookie },
  });
  console.log("Brief UI page status:", briefPageRes.status);
  if (briefPageRes.status !== 200) {
    throw new Error(`Brief page returned status ${briefPageRes.status}`);
  }
  const briefHtml = await briefPageRes.text();
  if (!briefHtml.includes("<html") && !briefHtml.includes("<!DOCTYPE")) {
    throw new Error("Brief page HTML response is not valid HTML document");
  }
  console.log("Production Brief printable page rendered with 200 OK!");

  // 11. Verify Customer Memory page renders
  console.log("\n11. Testing Customer Memory Page (/memory)...");
  const memPageRes = await fetch(`${BASE_URL}/memory`, {
    headers: { Cookie: cookie },
  });
  console.log("Memory page status:", memPageRes.status);
  if (memPageRes.status !== 200) {
    throw new Error(`Memory page returned status ${memPageRes.status}`);
  }
  console.log("Customer Memory page rendered with 200 OK!");

  // 12. Check auto-drafted suggested memories for confirmed order
  console.log("\n12. Verifying Auto-Drafted Customer Memories on Order Confirmation...");
  const autoMemRes = await fetch(`${BASE_URL}/api/memory?customerId=${customerId}`, {
    headers: { Cookie: cookie },
  });
  const autoMemData = await autoMemRes.json();
  const unverifiedSuggestions = autoMemData.memories.filter((m) => m.verified === false);
  console.log(`Found ${unverifiedSuggestions.length} unverified suggested memories drafted for customer.`);
  if (unverifiedSuggestions.length < 1) {
    throw new Error("Expected suggested customer memories to be drafted upon order confirmation");
  }
  console.log("Sample drafted suggestion:", unverifiedSuggestions[0].fact);

  console.log("\n==========================================================");
  console.log("=== ALL PHASE 5b & 7 LIVE CHECKS PASSED SUCCESSFULLY ===");
  console.log("==========================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
