import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ordermind_dev";

async function populateIshanWorkspace() {
  console.log("===================================================================");
  console.log("  Populating InTheBox Workspace for Ishan Kumar with Rich Data     ");
  console.log("===================================================================");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("Connected to MongoDB:", db.databaseName);

  // 1. Create or update user: ishan@inthebox.pack and demo@ordermind.pack
  const hashedPassword = await bcrypt.hash("password123", 10);
  const now = new Date();

  const ishanUser = {
    email: "ishan@inthebox.pack",
    name: "Ishan Kumar",
    passwordHash: hashedPassword,
    role: "OWNER",
    createdAt: now,
    updatedAt: now,
  };

  const demoUser = {
    email: "demo@ordermind.pack",
    name: "Ishan Kumar",
    passwordHash: hashedPassword,
    role: "OWNER",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("users").updateOne(
    { email: "ishan@inthebox.pack" },
    { $set: ishanUser },
    { upsert: true }
  );

  await db.collection("users").updateOne(
    { email: "demo@ordermind.pack" },
    { $set: demoUser },
    { upsert: true }
  );

  const userDoc = await db.collection("users").findOne({ email: "ishan@inthebox.pack" });
  const demoDoc = await db.collection("users").findOne({ email: "demo@ordermind.pack" });
  const userId = userDoc._id.toString();
  const demoUserId = demoDoc._id.toString();

  // 2. Create InTheBox Workspace
  const workspaceDoc = {
    name: "InTheBox Packaging Studio",
    industry: "Luxury Rigid & Structural Packaging",
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  };

  const wsResult = await db.collection("workspaces").insertOne(workspaceDoc);
  const workspaceId = wsResult.insertedId.toString();

  // Create members
  await db.collection("members").updateOne(
    { workspaceId, userId },
    { $set: { workspaceId, userId, role: "OWNER", createdAt: now } },
    { upsert: true }
  );

  await db.collection("members").updateOne(
    { workspaceId, userId: demoUserId },
    { $set: { workspaceId, userId: demoUserId, role: "OWNER", createdAt: now } },
    { upsert: true }
  );

  console.log(`✓ Workspace created: InTheBox Packaging Studio (${workspaceId})`);

  // 3. Create 4 Realistic Clients
  const clientsData = [
    {
      _id: new ObjectId(),
      workspaceId,
      name: "Aarav Cosmetics",
      industry: "Organic Cosmetics & Luxury Skincare",
      contacts: [
        { name: "Aarav Patel", phone: "+91 98765 43210", email: "aarav@aaravcosmetics.in", role: "Founder & Creative Director" },
        { name: "Pooja Sharma", phone: "+91 98765 43211", email: "pooja@aaravcosmetics.in", role: "Procurement Lead" },
      ],
      requirements: "350 GSM White SBS board with gold foil stamping, custom EVA foam bottle insert tray, magnetic closure.",
      lifetimeValue: 450000,
      orderCount: 4,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      workspaceId,
      name: "Mehta Naturals",
      industry: "D2C Ayurvedic Wellness",
      contacts: [
        { name: "Rajesh Mehta", phone: "+91 98234 56789", email: "rajesh@mehtanaturals.com", role: "Operations Head" },
      ],
      requirements: "3-ply E-flute corrugated self-locking mailers, single color black soy ink printing, eco-friendly water-based varnish.",
      lifetimeValue: 280000,
      orderCount: 3,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      workspaceId,
      name: "Saffron Luxe Sweets",
      industry: "Artisanal Confectionery & Festive Gifting",
      contacts: [
        { name: "Vikram Singhania", phone: "+91 98111 22334", email: "vikram@saffronluxe.com", role: "Managing Director" },
      ],
      requirements: "Book-style rigid sweet box, 2mm Kappa greyboard, 150 GSM art paper wrap, soft-touch matte lamination, spot UV logo, satin ribbon pull.",
      lifetimeValue: 850000,
      orderCount: 6,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      workspaceId,
      name: "Urban Botanics",
      industry: "Essential Oils & Home Fragrances",
      contacts: [
        { name: "Ananya Deshmukh", phone: "+91 97654 32109", email: "ananya@urbanbotanics.co", role: "Brand Lead" },
      ],
      requirements: "300 GSM Virgin Kraft paper monocartons, die-cut display window with PVC film, soy ink 2-color screen print.",
      lifetimeValue: 195000,
      orderCount: 2,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.collection("clients").insertMany(clientsData);
  await db.collection("customers").insertMany(clientsData);
  console.log("✓ Created 4 realistic packaging clients");

  const [aaravClient, mehtaClient, saffronClient, urbanClient] = clientsData;

  // 4. Create Conversations & Messages
  // Conversation 1: Aarav Cosmetics (WhatsApp chat with changes, deltas, audio, and conflict)
  const conv1Id = new ObjectId().toString();
  const conv1Messages = [
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 36 * 3600 * 1000),
      type: "text",
      content: "Hi Ishan, we need custom rigid gift boxes for our new festive perfume collection.",
      source: "whatsapp",
    },
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 35 * 3600 * 1000),
      type: "text",
      content: "Let's start with 100 boxes. Dimensions: 220x150x65 mm. Use 350 GSM White SBS board with gold foil logo stamping.",
      source: "whatsapp",
    },
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000),
      type: "voice",
      content: "Ishan bhai, actually please increase the quantity from 100 to 500 boxes! Also make it 5mm taller so the glass dropper fits smoothly.",
      transcript: "Ishan bhai, actually please increase the quantity from 100 to 500 boxes! Also make it 5mm taller so the glass dropper fits smoothly.",
      source: "whatsapp",
    },
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 18 * 3600 * 1000),
      type: "text",
      content: "For the outer board, use same material as last time (we liked the 300 GSM Matte texture from batch ORD-0099).",
      source: "whatsapp",
    },
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 4 * 3600 * 1000),
      type: "text",
      content: "Please deliver by next Friday November 14th without delay.",
      source: "whatsapp",
    },
  ];

  await db.collection("conversations").insertOne({
    _id: new ObjectId(conv1Id),
    workspaceId,
    customerId: aaravClient._id.toString(),
    clientId: aaravClient._id.toString(),
    customerName: aaravClient.name,
    clientName: aaravClient.name,
    channel: "whatsapp",
    lastMessage: conv1Messages[conv1Messages.length - 1].content,
    lastMessageAt: conv1Messages[conv1Messages.length - 1].timestamp,
    messageCount: conv1Messages.length,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("messages").insertMany(conv1Messages);

  // Conversation 2: Mehta Naturals (Hinglish voice notes + PDF spec sheet)
  const conv2Id = new ObjectId().toString();
  const conv2Messages = [
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv2Id,
      senderId: "rajesh_mehta",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 48 * 3600 * 1000),
      type: "text",
      content: "Namaste Ishan ji, humein 500 corrugated mailer boxes chahiye shipping ke liye.",
      source: "whatsapp",
    },
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv2Id,
      senderId: "rajesh_mehta",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 47 * 3600 * 1000),
      type: "text",
      content: "Size hoga 250x180x80 mm, 3-ply E-flute kraft board, black soy ink printing.",
      source: "whatsapp",
    },
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv2Id,
      senderId: "rajesh_mehta",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 20 * 3600 * 1000),
      type: "voice",
      content: "Advance payment of Rs 45,000 transfer kar diya hai, design approval bhi done hai. Production chalu karo please.",
      transcript: "Advance payment of Rs 45,000 transfer kar diya hai, design approval bhi done hai. Production chalu karo please.",
      source: "whatsapp",
    },
  ];

  await db.collection("conversations").insertOne({
    _id: new ObjectId(conv2Id),
    workspaceId,
    customerId: mehtaClient._id.toString(),
    clientId: mehtaClient._id.toString(),
    customerName: mehtaClient.name,
    clientName: mehtaClient.name,
    channel: "whatsapp",
    lastMessage: conv2Messages[conv2Messages.length - 1].content,
    lastMessageAt: conv2Messages[conv2Messages.length - 1].timestamp,
    messageCount: conv2Messages.length,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("messages").insertMany(conv2Messages);

  // Conversation 3: Saffron Luxe Sweets
  const conv3Id = new ObjectId().toString();
  const conv3Messages = [
    {
      _id: new ObjectId(),
      workspaceId,
      conversationId: conv3Id,
      senderId: "vikram_singhania",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 12 * 3600 * 1000),
      type: "text",
      content: "Need 1,200 festive Mithai presentation boxes for Diwali corporate hampers. 2mm Kappa greyboard with gold foil and satin ribbon.",
      source: "whatsapp",
    },
  ];

  await db.collection("conversations").insertOne({
    _id: new ObjectId(conv3Id),
    workspaceId,
    customerId: saffronClient._id.toString(),
    clientId: saffronClient._id.toString(),
    customerName: saffronClient.name,
    clientName: saffronClient.name,
    channel: "whatsapp",
    lastMessage: conv3Messages[0].content,
    lastMessageAt: conv3Messages[0].timestamp,
    messageCount: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("messages").insertMany(conv3Messages);

  // 5. Create Realistic Orders
  const ordersData = [
    {
      _id: new ObjectId(),
      workspaceId,
      orderNumber: "ORD-0104",
      title: "500 Luxury Cosmetic Shoulder Boxes",
      customerId: aaravClient._id.toString(),
      clientId: aaravClient._id.toString(),
      customerName: "Aarav Cosmetics",
      clientName: "Aarav Cosmetics",
      conversationId: conv1Id,
      status: "NEEDS_REVIEW",
      stage: "DRAFT",
      type: "manufacturing",
      quote: {
        status: "Draft",
        currency: "INR",
        unitPrice: 165,
        quantity: 500,
        subtotal: 82500,
        tax: 14850,
        total: 97350,
        lineItems: [
          { name: "350 GSM White SBS Outer Box", quantity: 500, unitPrice: 95, total: 47500 },
          { name: "Gold Foil Stamping Block & Application", quantity: 500, unitPrice: 35, total: 17500 },
          { name: "Custom EVA Foam Insert Bottle Die", quantity: 500, unitPrice: 35, total: 17500 },
        ],
      },
      currentFields: {
        productType: { value: "Rigid Box", status: "CONFIRMED", confidence: 1 },
        quantity: { value: 500, status: "CONFIRMED", confidence: 1 },
        dimensions: { value: "220 x 150 x 70 mm", status: "INFERRED", confidence: 0.92 },
        material: { value: "350 GSM White SBS board", status: "CONFLICTING", confidence: 0.85 },
        finish: { value: "Gold Foil Stamping + Matte Lamination", status: "CONFIRMED", confidence: 0.98 },
        printing: { value: "4-Color Offset + 1 Spot Gold", status: "CONFIRMED", confidence: 0.95 },
        deadline: { value: "November 14, 2026", status: "CONFIRMED", confidence: 0.99 },
      },
      deadline: new Date(Date.now() + 11 * 24 * 3600 * 1000),
      hasConflicts: true,
      hasMissing: false,
      hasInferred: true,
      advancePaid: false,
      designApproved: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      workspaceId,
      orderNumber: "ORD-0105",
      title: "500 E-Flute Corrugated Shipping Mailers",
      customerId: mehtaClient._id.toString(),
      clientId: mehtaClient._id.toString(),
      customerName: "Mehta Naturals",
      clientName: "Mehta Naturals",
      conversationId: conv2Id,
      status: "CONFIRMED",
      stage: "IN_PRODUCTION",
      type: "manufacturing",
      quote: {
        status: "Accepted",
        currency: "INR",
        unitPrice: 90,
        quantity: 500,
        subtotal: 45000,
        tax: 8100,
        total: 53100,
      },
      currentFields: {
        productType: { value: "Corrugated Mailer", status: "CONFIRMED", confidence: 1 },
        quantity: { value: 500, status: "CONFIRMED", confidence: 1 },
        dimensions: { value: "250 x 180 x 80 mm", status: "CONFIRMED", confidence: 1 },
        material: { value: "3-ply E-flute Kraft Board", status: "CONFIRMED", confidence: 1 },
        finish: { value: "Water-based Eco Varnish", status: "CONFIRMED", confidence: 1 },
        printing: { value: "1-Color Black Soy Ink Screen Print", status: "CONFIRMED", confidence: 1 },
        deadline: { value: "November 10, 2026", status: "CONFIRMED", confidence: 1 },
      },
      deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      hasConflicts: false,
      hasMissing: false,
      hasInferred: false,
      advancePaid: true,
      advanceAmount: 45000,
      designApproved: true,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      workspaceId,
      orderNumber: "ORD-0106",
      title: "1,200 Book-Style Festive Sweet Presentation Boxes",
      customerId: saffronClient._id.toString(),
      clientId: saffronClient._id.toString(),
      customerName: "Saffron Luxe Sweets",
      clientName: "Saffron Luxe Sweets",
      conversationId: conv3Id,
      status: "NEEDS_REVIEW",
      stage: "QUOTE_SENT",
      type: "manufacturing",
      quote: {
        status: "Sent",
        currency: "INR",
        unitPrice: 240,
        quantity: 1200,
        subtotal: 288000,
        tax: 51840,
        total: 339840,
      },
      currentFields: {
        productType: { value: "Book-Style Rigid Box", status: "CONFIRMED", confidence: 1 },
        quantity: { value: 1200, status: "CONFIRMED", confidence: 1 },
        dimensions: { value: "280 x 200 x 55 mm", status: "INFERRED", confidence: 0.88 },
        material: { value: "2mm Kappa Greyboard + 150 GSM Art Wrap", status: "CONFIRMED", confidence: 0.95 },
        finish: { value: "Soft-Touch Matte + Spot UV + Satin Pull", status: "CONFIRMED", confidence: 0.95 },
        printing: { value: "Pantone Metallic Gold + CMYK", status: "CONFIRMED", confidence: 0.92 },
        deadline: { value: "October 28, 2026", status: "INFERRED", confidence: 0.85 },
      },
      deadline: new Date(Date.now() + 25 * 24 * 3600 * 1000),
      hasConflicts: false,
      hasMissing: false,
      hasInferred: true,
      advancePaid: false,
      designApproved: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      workspaceId,
      orderNumber: "ORD-0107",
      title: "2,500 Kraft Window Monocartons",
      customerId: urbanClient._id.toString(),
      clientId: urbanClient._id.toString(),
      customerName: "Urban Botanics",
      clientName: "Urban Botanics",
      status: "DRAFT",
      stage: "DRAFT",
      type: "manufacturing",
      currentFields: {
        productType: { value: "Folding Carton", status: "CONFIRMED", confidence: 1 },
        quantity: { value: 2500, status: "CONFIRMED", confidence: 1 },
        dimensions: { value: "85 x 85 x 160 mm", status: "CONFIRMED", confidence: 1 },
        material: { value: "300 GSM Virgin Kraft Board", status: "CONFIRMED", confidence: 1 },
        finish: { value: "Die-Cut Window with 100 Micron PVC Film", status: "CONFIRMED", confidence: 0.95 },
        printing: { value: "2-Color Soy Ink Screen Print", status: "CONFIRMED", confidence: 0.95 },
        deadline: { value: "Missing target deadline", status: "MISSING", confidence: 0 },
      },
      deadline: new Date(Date.now() + 18 * 24 * 3600 * 1000),
      hasConflicts: false,
      hasMissing: true,
      hasInferred: false,
      advancePaid: false,
      designApproved: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.collection("orders").insertMany(ordersData);
  console.log("✓ Created 4 realistic orders across pipeline stages");

  // 6. Create Tasks & Pinned Notes for Workspace Home
  const tasksData = [
    {
      workspaceId,
      title: "Send revised foil block proof to Aarav Patel",
      assignedTo: "Ishan Kumar",
      status: "pending",
      dueAt: new Date(Date.now() + 4 * 3600 * 1000),
      priority: "high",
      createdAt: now,
    },
    {
      workspaceId,
      title: "Check E-flute board stock in bay #3 for Mehta order",
      assignedTo: "Press Operator",
      status: "completed",
      dueAt: now,
      priority: "medium",
      createdAt: now,
    },
    {
      workspaceId,
      title: "Verify advance payment receipt for Saffron Luxe ₹1,50,000",
      assignedTo: "Accounts",
      status: "pending",
      dueAt: new Date(Date.now() + 24 * 3600 * 1000),
      priority: "high",
      createdAt: now,
    },
  ];
  await db.collection("tasks").insertMany(tasksData);

  const notesData = [
    {
      workspaceId,
      title: "Festive Season Foil Stamping Notice",
      content: "Spot Gold block stamping queue is currently at 48-hour turnaround. Remind luxury clients to approve dielines early.",
      pinned: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      workspaceId,
      title: "Kraft Paper Supplier Update",
      content: "Supplier confirmed 300 GSM Virgin Kraft reel delivery on Tuesday morning. Bay #2 reserved.",
      pinned: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection("notes").insertMany(notesData);

  // 7. Create Schedule Events (Today Strip)
  const todayStr = new Date().toISOString().slice(0, 10);
  const scheduleEventsData = [
    {
      workspaceId,
      title: "Dieline & Foam Fitment Review with Aarav Cosmetics",
      date: todayStr,
      time: "11:30 AM",
      type: "consultation",
      orderId: ordersData[0]._id.toString(),
      createdAt: now,
    },
    {
      workspaceId,
      title: "Advance Payment Verification: Mehta Naturals (₹45,000)",
      date: todayStr,
      time: "02:00 PM",
      type: "advance",
      orderId: ordersData[1]._id.toString(),
      createdAt: now,
    },
    {
      workspaceId,
      title: "Corrugated E-Flute Die Cutting Run #105 Start",
      date: todayStr,
      time: "04:30 PM",
      type: "deadline",
      orderId: ordersData[1]._id.toString(),
      createdAt: now,
    },
  ];
  await db.collection("schedule_events").insertMany(scheduleEventsData);

  // 8. Create Customer Memory
  const memoryData = [
    {
      workspaceId,
      customerId: aaravClient._id.toString(),
      fact: "Prefers magnetic catch closures over friction lids for perfume gift boxes.",
      kind: "preference",
      verified: true,
      createdAt: now,
    },
    {
      workspaceId,
      customerId: aaravClient._id.toString(),
      fact: "'Same as last time' refers to 300 GSM Matte SBS board from order ORD-0099.",
      kind: "shorthand",
      verified: true,
      createdAt: now,
    },
    {
      workspaceId,
      customerId: mehtaClient._id.toString(),
      fact: "Always uses single color black soy ink on E-flute kraft for sustainability branding.",
      kind: "preference",
      verified: true,
      createdAt: now,
    },
  ];
  await db.collection("customer_memory").insertMany(memoryData);

  // 9. Create Company Brain
  const companyBrainDoc = {
    workspaceId,
    materials: [
      { name: "350 GSM White SBS Board", pricePerSheet: 45, unit: "sheet", stock: 12000 },
      { name: "2mm Kappa Greyboard", pricePerSheet: 85, unit: "sheet", stock: 5500 },
      { name: "3-ply E-flute Kraft", pricePerSheet: 28, unit: "sheet", stock: 18000 },
      { name: "300 GSM Virgin Kraft", pricePerSheet: 38, unit: "sheet", stock: 9000 },
    ],
    finishes: [
      { name: "Hot Foil Stamping (Gold/Silver)", setupCost: 1500, perUnitCost: 4.5 },
      { name: "Soft-Touch Matte Lamination", setupCost: 800, perUnitCost: 2.8 },
      { name: "Spot UV Gloss Coating", setupCost: 1200, perUnitCost: 3.5 },
      { name: "Custom Die Cutting & Creasing", setupCost: 2500, perUnitCost: 1.5 },
    ],
    outOfScopeItems: [
      "Logo design from scratch",
      "Marketing & advertising copy writing",
      "Product photography & video shoots",
      "Social media brand strategy",
    ],
    updatedAt: now,
  };

  await db.collection("company_brain").updateOne(
    { workspaceId },
    { $set: companyBrainDoc },
    { upsert: true }
  );

  console.log("✓ InTheBox Packaging Studio fully populated with live manufacturing data!");
  await client.close();
}

populateIshanWorkspace().catch((err) => {
  console.error("Population failed:", err);
  process.exit(1);
});
