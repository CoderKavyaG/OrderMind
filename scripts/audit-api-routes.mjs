const BASE_URL = "http://localhost:3005";

async function main() {
  console.log("=== API Route Verification Audit ===");
  const results = [];

  const logTest = (route, method, status, outcome, notes) => {
    results.push({ route, method, status, outcome, notes });
    console.log(`[${status === 200 || status === 201 ? "PASS" : "FAIL"}] ${method} ${route} -> Status: ${status} | ${outcome} (${notes})`);
  };

  // 1. Health
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    logTest("/api/health", "GET", res.status, res.ok ? "WORKING" : "FAIL", `status: ${data.status}`);
  } catch (err) {
    logTest("/api/health", "GET", 500, "FAIL", err.message);
  }

  // 2. Signup
  let cookie = "";
  const testEmail = `audit_${Date.now()}@packco.test`;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Audit User",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const data = await res.json();
    const setCookie = res.headers.get("set-cookie") || "";
    const match = setCookie.match(/ordermind_token=([^;]+)/);
    cookie = match ? `ordermind_token=${match[1]}` : "";
    logTest("/api/auth/signup", "POST", res.status, res.ok ? "WORKING" : "FAIL", `user: ${data.user?.email}`);
  } catch (err) {
    logTest("/api/auth/signup", "POST", 500, "FAIL", err.message);
  }

  // 3. /api/auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: cookie } });
    const data = await res.json();
    logTest("/api/auth/me", "GET", res.status, res.ok ? "WORKING" : "FAIL", `email: ${data.user?.email}`);
  } catch (err) {
    logTest("/api/auth/me", "GET", 500, "FAIL", err.message);
  }

  // 4. /api/onboarding
  try {
    const res = await fetch(`${BASE_URL}/api/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        businessName: "Clean Empty Plant",
        industry: "Packaging",
      }),
    });
    const data = await res.json();
    logTest("/api/onboarding", "POST", res.status, res.ok ? "WORKING" : "FAIL", `workspace: ${data.workspace?.name}`);
  } catch (err) {
    logTest("/api/onboarding", "POST", 500, "FAIL", err.message);
  }

  // 5. /api/customers (GET empty)
  try {
    const res = await fetch(`${BASE_URL}/api/customers`, { headers: { Cookie: cookie } });
    const data = await res.json();
    logTest("/api/customers", "GET", res.status, res.ok ? "WORKING" : "FAIL", `count: ${data.customers?.length}`);
  } catch (err) {
    logTest("/api/customers", "GET", 500, "FAIL", err.message);
  }

  // 6. /api/customers (POST new customer)
  let customerId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        name: "Audit Client Co",
        company: "Audit Corp",
        phone: "+1 555-0199",
        email: "client@audit.test",
        notes: "Strict rigid box testing",
      }),
    });
    const data = await res.json();
    customerId = data.customer?.id || "";
    logTest("/api/customers", "POST", res.status, res.ok ? "WORKING" : "FAIL", `created: ${data.customer?.name} (id: ${customerId})`);
  } catch (err) {
    logTest("/api/customers", "POST", 500, "FAIL", err.message);
  }

  // 7. /api/channels
  try {
    const res = await fetch(`${BASE_URL}/api/channels`, { headers: { Cookie: cookie } });
    const data = await res.json();
    logTest("/api/channels", "GET", res.status, res.ok ? "WORKING" : "FAIL", `channels: ${data.channels?.length}`);
  } catch (err) {
    logTest("/api/channels", "GET", 500, "FAIL", err.message);
  }

  // 8. /api/inbox/conversations (GET empty)
  try {
    const res = await fetch(`${BASE_URL}/api/inbox/conversations`, { headers: { Cookie: cookie } });
    const data = await res.json();
    logTest("/api/inbox/conversations", "GET", res.status, res.ok ? "WORKING" : "FAIL", `count: ${data.conversations?.length}`);
  } catch (err) {
    logTest("/api/inbox/conversations", "GET", 500, "FAIL", err.message);
  }

  // 9. /api/inbox/conversations (POST new manual import conversation)
  let convId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/inbox/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        customerId,
        title: "Test Packaging Chat",
        rawText: `[10/12/26, 10:00:00] Audit Client Co: Need 500 luxury rigid boxes
[10/12/26, 10:01:00] Audit Client Co: Make them 200x150x80mm with matte black finish`,
      }),
    });
    const data = await res.json();
    convId = data.conversationId || "";
    logTest("/api/inbox/conversations", "POST", res.status, res.ok ? "WORKING" : "FAIL", `created convId: ${convId}, count: ${data.messageCount}`);
  } catch (err) {
    logTest("/api/inbox/conversations", "POST", 500, "FAIL", err.message);
  }

  // 10. /api/inbox/conversations/:id
  try {
    const res = await fetch(`${BASE_URL}/api/inbox/conversations/${convId}`, { headers: { Cookie: cookie } });
    const data = await res.json();
    logTest("/api/inbox/conversations/[id]", "GET", res.status, res.ok ? "WORKING" : "FAIL", `messages: ${data.messages?.length}`);
  } catch (err) {
    logTest("/api/inbox/conversations/[id]", "GET", 500, "FAIL", err.message);
  }

  // 11. /api/conversations/:id/process
  let orderId = "";
  try {
    const res = await fetch(`${BASE_URL}/api/conversations/${convId}/process`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const data = await res.json();
    orderId = data.orderId || "";
    logTest("/api/conversations/[id]/process", "POST", res.status, res.ok ? "WORKING" : "FAIL", `events: ${data.eventsCount}, orderId: ${orderId}`);
  } catch (err) {
    logTest("/api/conversations/[id]/process", "POST", 500, "FAIL", err.message);
  }

  // 12. /api/orders
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, { headers: { Cookie: cookie } });
    const data = await res.json();
    orderId = data.orders?.[0]?.id || "";
    logTest("/api/orders", "GET", res.status, res.ok ? "WORKING" : "FAIL", `orders count: ${data.orders?.length}, active orderId: ${orderId}`);
  } catch (err) {
    logTest("/api/orders", "GET", 500, "FAIL", err.message);
  }

  // 13. /api/orders/:id
  try {
    const res = await fetch(`${BASE_URL}/api/orders/${orderId}`, { headers: { Cookie: cookie } });
    const data = await res.json();
    logTest("/api/orders/[id]", "GET", res.status, res.ok ? "WORKING" : "FAIL", `order status: ${data.order?.status}`);
  } catch (err) {
    logTest("/api/orders/[id]", "GET", 500, "FAIL", err.message);
  }

  // 14. /api/orders/:id/events (POST operator confirmation)
  try {
    const res = await fetch(`${BASE_URL}/api/orders/${orderId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        field: "productType",
        action: "confirm",
        newValue: "Luxury Rigid Boxes",
        note: "Verified by operator",
      }),
    });
    const data = await res.json();
    logTest("/api/orders/[id]/events", "POST", res.status, res.ok ? "WORKING" : "FAIL", `order status: ${data.order?.status}`);
  } catch (err) {
    logTest("/api/orders/[id]/events", "POST", 500, "FAIL", err.message);
  }

  // 15. /api/orders/:id/brief (GET)
  try {
    const res = await fetch(`${BASE_URL}/api/orders/${orderId}/brief`, { headers: { Cookie: cookie } });
    const data = await res.json();
    logTest("/api/orders/[id]/brief", "GET", res.status, res.ok ? "WORKING" : "FAIL", `brief: ${data.brief ? "exists" : "none"}`);
  } catch (err) {
    logTest("/api/orders/[id]/brief", "GET", 500, "FAIL", err.message);
  }

  // 16. /api/memory (GET & POST)
  let memId = "";
  try {
    const postRes = await fetch(`${BASE_URL}/api/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        customerId,
        fact: "Prefers soft-touch matte lamination on all gift boxes.",
        kind: "preference",
        verified: true,
      }),
    });
    const postData = await postRes.json();
    memId = postData.memory?.id || "";
    logTest("/api/memory", "POST", postRes.status, postRes.ok ? "WORKING" : "FAIL", `created memory: ${memId}`);

    const getRes = await fetch(`${BASE_URL}/api/memory`, { headers: { Cookie: cookie } });
    const getData = await getRes.json();
    logTest("/api/memory", "GET", getRes.status, getRes.ok ? "WORKING" : "FAIL", `memories: ${getData.memories?.length}`);
  } catch (err) {
    logTest("/api/memory", "POST/GET", 500, "FAIL", err.message);
  }

  // 17. /api/memory/:id (PATCH & DELETE)
  if (memId) {
    try {
      const patchRes = await fetch(`${BASE_URL}/api/memory/${memId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ verified: false }),
      });
      logTest("/api/memory/[id]", "PATCH", patchRes.status, patchRes.ok ? "WORKING" : "FAIL", "revoked verification");

      const delRes = await fetch(`${BASE_URL}/api/memory/${memId}`, {
        method: "DELETE",
        headers: { Cookie: cookie },
      });
      logTest("/api/memory/[id]", "DELETE", delRes.status, delRes.ok ? "WORKING" : "FAIL", "deleted memory fact");
    } catch (err) {
      logTest("/api/memory/[id]", "PATCH/DELETE", 500, "FAIL", err.message);
    }
  }

  // 18. /api/auth/logout
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
    logTest("/api/auth/logout", "POST", res.status, res.ok ? "WORKING" : "FAIL", "cookie cleared");
  } catch (err) {
    logTest("/api/auth/logout", "POST", 500, "FAIL", err.message);
  }

  console.log("\n=== Total API Tests Run:", results.length, "===");
}

main().catch(console.error);
