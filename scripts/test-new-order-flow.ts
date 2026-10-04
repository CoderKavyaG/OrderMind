import { getDb } from "../server/db/mongodb";

async function main() {
  console.log("=== Testing Real New Order Chat & Customers Flow ===");

  // 1. Health & DB
  const db = await getDb();
  console.log("✔ Connected to MongoDB Atlas");

  // 2. Fetch or create a session user and workspace
  const user = await db.collection("users").findOne({});
  if (!user) throw new Error("No user found in DB");
  const member = await db.collection("members").findOne({ userId: user._id.toString() });
  const workspace = await db.collection("workspaces").findOne({ _id: member?.workspaceId ? new (require("mongodb").ObjectId)(member.workspaceId) : undefined });
  console.log(`✔ Workspace found: ${workspace?.name} (ID: ${workspace?._id})`);

  // 3. Create or find customer Aarav Gupta
  let customer = await db.collection("customers").findOne({ workspaceId: workspace?._id.toString(), name: "Aarav Gupta" });
  if (!customer) {
    const custRes = await db.collection("customers").insertOne({
      workspaceId: workspace?._id.toString(),
      name: "Aarav Gupta",
      company: "Gupta Organic Foods",
      phone: "+91 98111 22334",
      email: "aarav@guptafoods.com",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    customer = await db.collection("customers").findOne({ _id: custRes.insertedId });
  }
  console.log(`✔ Customer active: ${customer?.name} (${customer?.company})`);

  // 4. Ingest WhatsApp conversation export via import endpoint
  console.log("-> Simulating '+ New Order Chat' modal submission...");
  const rawChat = `[04/10/26, 14:00:00] Aarav Gupta: Hi, we need 1000 customized corrugated tuck-top mailer boxes for our organic snack packs.
[04/10/26, 14:02:15] Aarav Gupta: Dimensions are 200x150x60 mm. Please use 3-ply Kraft E-flute board with white screen printing on top flap.
[04/10/26, 14:03:00] Aarav Gupta: Delivery required by November 15.`;

  const { saveImportedConversation } = await import("../server/services/inbox.service");
  const { processConversation, getConversationEvents } = await import("../server/ai/extractor");
  const { syncExtractedEventsToOrder, getOrderDetails } = await import("../server/services/order.service");

  const workspaceId = workspace?._id.toString();
  const customerId = customer?._id.toString();
  if (!workspaceId || !customerId) throw new Error("Workspace or customer missing ID");

  const importResult = await saveImportedConversation(workspaceId, {
    customerId: customerId,
    title: "Gupta Snack Mailer Box Launch",
    rawText: rawChat,
  });
  console.log(`✔ Conversation imported: ${importResult.conversationId} (${importResult.messageCount} messages)`);

  // 5. Process conversation with Gemma
  console.log("-> Gemma AI extracting claims from WhatsApp transcript...");
  const extractRes = await processConversation(workspaceId, importResult.conversationId);
  console.log(`✔ Gemma processed: ${extractRes.processedCount} messages, ${extractRes.eventsCount} claims extracted.`);

  // 6. Sync to order
  const events = await getConversationEvents(workspaceId, importResult.conversationId);
  const orderInfo = await syncExtractedEventsToOrder(
    workspaceId,
    importResult.conversationId,
    customerId,
    events
  );
  console.log(`✔ Order generated: ${orderInfo.orderNumber} (ID: ${orderInfo.id}, Status: ${orderInfo.status})`);

  // 7. Inspect replayed specs
  const details = await getOrderDetails(workspaceId, orderInfo.id);
  console.log("\nReplayed Order Specs:");
  for (const [k, v] of Object.entries(details?.reducedState?.fields || {})) {
    const f = v as any;
    console.log(`   - ${k.padEnd(16)}: "${f.value || 'None'}" [${f.status}]`);
  }

  // 8. Fetch workspace home data
  const { getWorkspaceDashboardData } = await import("../server/services/workspaceHome.service");
  const homeData = await getWorkspaceDashboardData(workspaceId);
  console.log("\n✔ Workspace Home Data live check:");
  console.log(`   - Active Client Feeds : ${homeData.activeClientFeeds.length}`);
  console.log(`   - Total Active Orders : ${homeData.pipelineStats.totalActive}`);
  console.log(`   - Total Confirmed     : ${homeData.pipelineStats.totalConfirmed}`);
  console.log(`   - Needs Attention     : ${homeData.needsAttentionQueue.length}`);
  console.log("\n=======================================================");
  console.log("✔ FLOW EXECUTION PASSED COMPLETELY WITHOUT ERRORS!");
  console.log("=======================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Test flow error:", err);
  process.exit(1);
});
