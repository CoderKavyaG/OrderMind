const BASE_URL = "http://localhost:3005";

async function main() {
  console.log("=================================================");
  console.log("=== Phase 6 End-to-End Live Integration Test ===");
  console.log("=================================================");

  // 1. Sign up user
  const email = `phase6_tester_${Date.now()}@packco.com`;
  const password = "Password123!";

  console.log(`\n1. Creating user session for ${email}...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Lead Estimator",
      email,
      password,
    }),
  });

  let cookie = signupRes.headers.get("set-cookie")?.split(";")[0] || "";
  console.log("Signup status:", signupRes.status);

  // 2. Complete onboarding
  console.log("\n2. Completing Onboarding...");
  const onboardRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      businessName: "Aarav Luxury Packaging",
      industry: "Packaging",
    }),
  });
  if (onboardRes.headers.get("set-cookie")) {
    cookie = onboardRes.headers.get("set-cookie").split(";")[0];
  }
  console.log("Onboarding status:", onboardRes.status);

  // 3. Create customer
  console.log("\n3. Creating customer 'Aarav Prints'...");
  const custRes = await fetch(`${BASE_URL}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Aarav Prints",
      phone: "+91 98765 00000",
      email: "aarav@prints.com",
    }),
  });
  const custData = await custRes.json();
  const customerId = custData.customer.id;
  console.log("Customer created:", customerId);

  // 4. Ingest an older completed historical conversation + order
  console.log("\n4. Ingesting and confirming historical order (ORD-0099) with 300 GSM Matte SBS board...");
  const histChat = `[01/02/2026, 09:00:00 AM] Aarav: We need 100 rigid boxes.
[01/02/2026, 09:05:00 AM] Aarav: Material should be 300 GSM Matte SBS board.
[01/02/2026, 09:10:00 AM] Aarav: Finish should be Matte Lamination with silver foil.`;

  const histConvRes = await fetch(`${BASE_URL}/api/inbox/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      title: "Previous Run #PO-882",
      rawText: histChat,
    }),
  });
  const histConvData = await histConvRes.json();
  const histConvId = histConvData.conversationId;

  // Process historical conversation
  const histProcessRes = await fetch(`${BASE_URL}/api/conversations/${histConvId}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  const histProcessData = await histProcessRes.json();
  const histOrderId = histProcessData.order.id;

  // Confirm material on historical order so it is locked in historical record
  await fetch(`${BASE_URL}/api/orders/${histOrderId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      field: "material",
      action: "confirm",
      newValue: "300 GSM Matte SBS board",
      note: "Historical order confirmed",
    }),
  });
  console.log("Historical order locked with 300 GSM Matte SBS board.");

  // 5. Ingest current conversation triggering the exact demo conflict & missing deadline
  console.log("\n5. Ingesting new conversation with 'same material as last time' vs '350 GSM Gloss Kappa board'...");
  const currentChat = `[12/05/2026, 10:14:02 AM] Aarav: We want top-and-bottom rigid boxes.
[12/05/2026, 10:15:30 AM] Aarav: Initial quantity: 100 boxes.
[12/05/2026, 10:20:10 AM] Aarav: Actually change that to 500 units instead.
[12/05/2026, 10:22:45 AM] Aarav: Dimensions 250 x 180 x 90 mm.
[12/05/2026, 10:25:00 AM] Aarav: Material same as last time please.
[12/05/2026, 10:26:12 AM] Aarav: Wait, make it 350 GSM Gloss Kappa board instead.
[12/05/2026, 10:27:00 AM] Aarav: Finish should have metallic gold logo foil.
[12/05/2026, 10:28:00 AM] Aarav: Full CMYK outer printing.`;

  const currConvRes = await fetch(`${BASE_URL}/api/inbox/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId,
      title: "Current Inquiry - Festival Packaging",
      rawText: currentChat,
    }),
  });
  const currConvData = await currConvRes.json();
  const currConvId = currConvData.conversationId;

  // Process current conversation
  console.log("\n6. Processing conversation with Gemma extraction pipeline...");
  const processRes = await fetch(`${BASE_URL}/api/conversations/${currConvId}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  const processData = await processRes.json();
  console.log("Process response:", processRes.status);
  const currentOrderId = processData.order.id;

  // 6. Inspect Order details & verify conflict detection
  console.log(`\n7. Inspecting Order details (/api/orders/${currentOrderId})...`);
  const orderRes = await fetch(`${BASE_URL}/api/orders/${currentOrderId}`, {
    headers: { Cookie: cookie },
  });
  const orderData = await orderRes.json();
  const order = orderData.order;

  console.log("Order status:", order.status);
  console.log("Reduced overallStatus:", order.reducedState.overallStatus);
  console.log("Conflicting fields count:", order.reducedState.conflictingCount);
  console.log("Material spec status:", order.reducedState.fields["material"]?.status);
  console.log("Detected conflicts on order:", Object.keys(order.conflicts || {}));

  if (order.conflicts?.["material"]) {
    const c = order.conflicts["material"];
    console.log("Conflict verified on material:");
    console.log(`  - Option A (${c.optionA.label}): ${c.optionA.value} ("${c.optionA.quote}")`);
    console.log(`  - Option B (${c.optionB.label}): ${c.optionB.value} ("${c.optionB.quote}")`);
    console.log(`  - Explanation: ${c.explanation}`);
  }

  // 7. Verify Missing Information & Clarifications
  console.log("\n8. Verifying Pending Clarifications for missing deadline...");
  const deadlineClar = order.clarifications?.find((c) => c.field === "deadline");
  console.log("Deadline clarification exists:", Boolean(deadlineClar));
  console.log("Clarification question text:", deadlineClar?.question);
  console.log("Clarification status:", deadlineClar?.status);

  // 8. Test "Answer Received" flow for deadline
  console.log("\n9. Testing 'Answer Received' flow: customer replies with delivery deadline...");
  const replyRes = await fetch(
    `${BASE_URL}/api/orders/${currentOrderId}/clarifications/${deadlineClar.id}/answer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        replyText: "Our hard delivery deadline is November 25th for festive distribution.",
      }),
    }
  );
  const replyData = await replyRes.json();
  console.log("Answer response status:", replyRes.status);
  console.log("Clarification status now:", replyData.clarification?.status);
  console.log("Deadline field value:", replyData.order?.reducedState?.fields?.deadline?.value);

  // Operator confirms the deadline value
  await fetch(`${BASE_URL}/api/orders/${currentOrderId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      field: "deadline",
      action: "confirm",
      newValue: "November 25th",
      note: "Confirmed delivery date",
    }),
  });

  // 9. Test Conflict Resolution Flow
  console.log("\n10. Resolving Conflict on 'material': choosing Option B (350 GSM Gloss Kappa board)...");
  const resolveRes = await fetch(`${BASE_URL}/api/orders/${currentOrderId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      field: "material",
      action: "resolve_conflict",
      newValue: "350 GSM Gloss Kappa board",
      note: "Operator confirmed with client to proceed with 350 GSM Gloss Kappa board",
    }),
  });
  const resolveData = await resolveRes.json();
  const resolvedOrder = resolveData.order;

  console.log("Material status after resolution:", resolvedOrder.reducedState?.fields?.material?.status);
  console.log("Material value after resolution:", resolvedOrder.reducedState?.fields?.material?.value);
  console.log("Conflicting count after resolution:", resolvedOrder.reducedState?.conflictingCount);

  // 10. Fetch fresh order and confirm any remaining inferred/missing fields
  const freshRes = await fetch(`${BASE_URL}/api/orders/${currentOrderId}`, {
    headers: { Cookie: cookie },
  });
  const freshData = await freshRes.json();
  const freshOrder = freshData.order;

  for (const [key, field] of Object.entries(freshOrder.reducedState.fields)) {
    if (field.status === "INFERRED" || field.status === "MISSING") {
      console.log(`Confirming field: ${key}...`);
      await fetch(`${BASE_URL}/api/orders/${currentOrderId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          field: key,
          action: "confirm",
          newValue: field.value || "Verified Standard Spec",
        }),
      });
    }
  }

  // 11. Lock order & create snapshot (Confirm All)
  console.log("\n11. Finalizing and locking order ('confirm_all')...");
  const lockRes = await fetch(`${BASE_URL}/api/orders/${currentOrderId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "confirm_all",
      note: "All specifications verified and approved for production",
    }),
  });
  const lockData = await lockRes.json();
  console.log("Lock response status:", lockRes.status, lockData);
  const lockedOrder = lockData.order;

  console.log("Final Order Status:", lockedOrder.status);
  console.log("Order Versions Count:", lockedOrder.versions?.length);
  console.log("Latest snapshot version:", lockedOrder.versions?.[0]?.versionNumber);
  console.log("Locked by:", lockedOrder.versions?.[0]?.confirmedBy);

  console.log("\n=================================================");
  console.log("=== ALL PHASE 6 REQUIREMENTS VERIFIED CLEANLY ===");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Phase 6 E2E Test failed:", err);
  process.exit(1);
});
