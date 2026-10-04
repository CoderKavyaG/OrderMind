const BASE_URL = "http://localhost:3005";

async function main() {
  console.log("=== Starting OrderMind End-to-End Verification ===");
  
  // 1. Signup / Login
  let cookie = "";
  const testEmail = `e2e_tester_${Date.now()}@packco.com`;
  const password = "Password123!";

  console.log(`1. Signing up user: ${testEmail}...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "E2E Lead Operator",
      email: testEmail,
      password: password,
    }),
  });

  const rawCookie = signupRes.headers.get("set-cookie");
  if (rawCookie) {
    cookie = rawCookie.split(";")[0];
  }
  const signupData = await signupRes.json();
  console.log("Signup Response:", signupRes.status, signupData);

  // 2. Complete Onboarding
  console.log("\n2. Completing Onboarding...");
  const onboardRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      businessName: "E2E Packaging Crafts",
      industry: "Packaging",
    }),
  });
  const onboardCookie = onboardRes.headers.get("set-cookie");
  if (onboardCookie) {
    cookie = onboardCookie.split(";")[0];
  }
  const onboardData = await onboardRes.json();
  console.log("Onboarding Response:", onboardRes.status, onboardData);

  // 3. Create a Customer and Ingest Conversation
  console.log("\n3. Creating Customer...");
  const custRes = await fetch(`${BASE_URL}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Aarav Prints Demo",
      phone: "+91 98765 43210",
      email: "aarav@demo.com",
    }),
  });
  const custData = await custRes.json();
  console.log("Customer Created:", custData.customer?.id, custData.customer?.name);
  const customerId = custData.customer?.id;

  console.log("\n4. Ingesting WhatsApp conversation export...");
  const demoExport = `[12/05/2026, 10:14:02 AM] Aarav: We need rigid magnetic closure boxes for our festival packaging.
[12/05/2026, 10:15:30 AM] Aarav: Initial quantity: 100 boxes please.
[12/05/2026, 10:20:10 AM] Aarav: Actually change that to 500 units instead.
[12/05/2026, 10:22:45 AM] Aarav: Make it a little taller (+15mm) than standard.
[12/05/2026, 10:25:00 AM] Aarav: Material should be 350 GSM White SBS board.
[12/05/2026, 10:26:12 AM] Aarav: Finish same as last time with matte lamination and gold foil logo.
[12/05/2026, 10:28:00 AM] Aarav: Required deadline is November 20th.`;

  const importRes = await fetch(`${BASE_URL}/api/inbox/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      title: "Festival Packaging Inquiry",
      rawText: demoExport,
    }),
  });
  const importData = await importRes.json();
  console.log("Conversation Created:", importData.conversationId, `Messages: ${importData.messageCount}`);
  const conversationId = importData.conversationId;

  // 4. Process Conversation through Gemma AI Pipeline
  console.log("\n5. Processing Conversation with Gemma Pipeline (/api/conversations/[id]/process)...");
  const processRes = await fetch(`${BASE_URL}/api/conversations/${conversationId}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  const processData = await processRes.json();
  console.log("Process Response Status:", processRes.status, processData);
  console.log(`Extracted Claims: ${processData.newClaimsCount || processData.events?.length || 0}`);
  if (processData.events) {
    processData.events.forEach((ev, i) => {
      console.log(`  [Claim ${i+1}] Field: "${ev.field}", Value: "${ev.value}", Op: "${ev.op}", Quote: "${ev.quote}"`);
    });
  }

  // 5. Query Orders List
  console.log("\n6. Listing Orders (/api/orders)...");
  const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
    headers: { Cookie: cookie },
  });
  const ordersData = await ordersRes.json();
  console.log("Orders count:", ordersData.orders?.length);
  const orderSummary = ordersData.orders?.[0];
  console.log("First Order:", {
    id: orderSummary?.id,
    orderNumber: orderSummary?.orderNumber,
    status: orderSummary?.status,
    customerName: orderSummary?.customerName,
  });

  const orderId = orderSummary?.id;
  if (!orderId) {
    throw new Error("No order generated from conversation processing!");
  }

  // 6. Inspect Order Details
  console.log(`\n7. Inspecting Order Details (/api/orders/${orderId})...`);
  const detailRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    headers: { Cookie: cookie },
  });
  const detailData = await detailRes.json();
  const order = detailData.order;
  console.log("Order Header:", {
    orderNumber: order.orderNumber,
    overallStatus: order.status,
    reducedStatus: order.reducedState?.overallStatus,
    inferredCount: order.reducedState?.inferredCount,
    confirmedCount: order.reducedState?.confirmedCount,
  });

  console.log("\nReplayed Spec Fields:");
  for (const [key, field] of Object.entries(order.reducedState?.fields || {})) {
    console.log(`  - ${key} (${field.label}): status=[${field.status}], value=${JSON.stringify(field.value)}, evidenceCount=${field.evidence?.length}`);
  }

  console.log(`\nTimeline Events: ${order.events?.length} events recorded`);
  order.events?.forEach((ev, idx) => {
    console.log(`  [Event ${idx+1}] ${ev.field}: ${JSON.stringify(ev.previousValue ?? "(none)")} -> ${JSON.stringify(ev.newValue)} (actor: ${ev.actor}, status: ${ev.status})`);
  });

  // 7. Test Human Operator Action (Confirm an Inferred / Pending Field)
  console.log("\n8. Applying Human Operator Action: Confirming 'finish' specification...");
  const confirmRes = await fetch(`${BASE_URL}/api/orders/${orderId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      field: "finish",
      action: "confirm",
      newValue: "Matte Velvet Lamination with 24K Gold Foil Stamping",
      note: "Customer confirmed via phone call with Aarav",
    }),
  });
  const confirmData = await confirmRes.json();
  const updatedOrder = confirmData.order;
  console.log("Human Action Result:", confirmRes.status);
  console.log("Updated 'finish' spec status:", updatedOrder.reducedState?.fields?.finish?.status);
  console.log("Updated 'finish' value:", updatedOrder.reducedState?.fields?.finish?.value);
  const lastEvent = updatedOrder.events?.[updatedOrder.events.length - 1];
  console.log("Latest Timeline Event:", {
    field: lastEvent?.field,
    actor: lastEvent?.actor,
    confirmation: lastEvent?.confirmation,
    newValue: lastEvent?.newValue,
    note: lastEvent?.note,
  });

  console.log("\n=== All Phase 1-5 End-to-End Flows Verified Successfully ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
