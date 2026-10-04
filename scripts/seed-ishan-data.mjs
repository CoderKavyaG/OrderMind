import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  return timestamp + random;
}

async function seedRichIshanData() {
  console.log("===================================================================");
  console.log("  Populating Comprehensive Workspace for Ishan Kumar (InTheBox)     ");
  console.log("===================================================================");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let dbData = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      dbData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch {
      dbData = {};
    }
  }

  const collections = [
    "users",
    "workspaces",
    "members",
    "clients",
    "customers",
    "conversations",
    "messages",
    "orders",
    "order_events",
    "order_versions",
    "order_quotes",
    "clarifications",
    "production_briefs",
    "tasks",
    "notes",
    "schedule_events",
    "customer_memory",
    "company_brain",
  ];
  for (const col of collections) {
    if (!Array.isArray(dbData[col])) {
      dbData[col] = [];
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const todayStr = nowIso.slice(0, 10);
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Users
  let ishanUser = dbData.users.find((u) => u.email === "ishan@inthebox.pack");
  if (!ishanUser) {
    ishanUser = {
      _id: generateObjectId(),
      email: "ishan@inthebox.pack",
      passwordHash: hashedPassword,
      name: "Ishan Kumar",
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    dbData.users.push(ishanUser);
  } else {
    ishanUser.passwordHash = hashedPassword;
  }

  let demoUser = dbData.users.find((u) => u.email === "demo@ordermind.pack");
  if (!demoUser) {
    demoUser = {
      _id: generateObjectId(),
      email: "demo@ordermind.pack",
      passwordHash: hashedPassword,
      name: "Ishan Kumar",
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    dbData.users.push(demoUser);
  } else {
    demoUser.passwordHash = hashedPassword;
  }

  // 2. Canonical Workspace: InTheBox Packaging Studio
  let workspace = dbData.workspaces.find((w) => w.name === "InTheBox Packaging Studio");
  let workspaceId;
  if (!workspace) {
    workspaceId = generateObjectId();
    workspace = {
      _id: workspaceId,
      name: "InTheBox Packaging Studio",
      industry: "Luxury Rigid & Structural Packaging",
      ownerId: ishanUser._id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    dbData.workspaces.push(workspace);
  } else {
    workspaceId = workspace._id;
  }

  ishanUser.activeWorkspaceId = workspaceId;
  demoUser.activeWorkspaceId = workspaceId;

  // Purge old data for this specific workspaceId to avoid duplicates and ensure a pristine setup
  for (const col of collections) {
    if (col !== "users" && col !== "workspaces") {
      dbData[col] = dbData[col].filter((item) => item.workspaceId !== workspaceId);
    }
  }

  // Members
  dbData.members.push(
    {
      _id: generateObjectId(),
      workspaceId,
      userId: ishanUser._id,
      role: "OWNER",
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      userId: demoUser._id,
      role: "OWNER",
      createdAt: nowIso,
    }
  );

  // 3. 6 Packaging Clients
  const client1Id = generateObjectId();
  const client2Id = generateObjectId();
  const client3Id = generateObjectId();
  const client4Id = generateObjectId();
  const client5Id = generateObjectId();
  const client6Id = generateObjectId();

  const clients = [
    {
      _id: client1Id,
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
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: client2Id,
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
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: client3Id,
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
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: client4Id,
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
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: client5Id,
      workspaceId,
      name: "Kaveri Silk Sarees",
      industry: "Heritage Silk Apparel & Bridal Wear",
      contacts: [
        { name: "Lakshmi Narayanan", phone: "+91 98450 11223", email: "lakshmi@kaverisilk.com", role: "Head of Retail" },
      ],
      requirements: "Drawer slide rigid apparel box, 1200 GSM greyboard with woven silk fabric wrap, gold embossed lettering.",
      lifetimeValue: 620000,
      orderCount: 5,
      status: "ACTIVE",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: client6Id,
      workspaceId,
      name: "Chai Point Artisan",
      industry: "Specialty Teas & Coffee Roastery",
      contacts: [
        { name: "Sameer Verma", phone: "+91 99100 88776", email: "sameer@chaipointartisan.in", role: "Product Development" },
      ],
      requirements: "Cylindrical composite tea canisters with food-grade aluminum foil lining and gold tin lids.",
      lifetimeValue: 340000,
      orderCount: 3,
      status: "ACTIVE",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  dbData.clients.push(...clients);
  dbData.customers.push(...clients);

  // 4. Conversations & Multi-modal Voice/Chat Scripts
  // Conv 1: Aarav Cosmetics (WhatsApp chat with voice note, quantity delta, material conflict)
  const conv1Id = generateObjectId();
  const conv1Messages = [
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Hi Ishan, we need custom rigid gift boxes for our new festive perfume collection launch.",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 35 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Let's start with 100 boxes. Dimensions: 220x150x65 mm. Use 350 GSM White SBS board with gold foil logo stamping.",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      type: "voice",
      content: "Ishan bhai, actually please increase the quantity from 100 to 500 boxes! Also make it 5mm taller (70mm) so the glass dropper fits smoothly without touching the top lid.",
      transcript: "Ishan bhai, actually please increase the quantity from 100 to 500 boxes! Also make it 5mm taller (70mm) so the glass dropper fits smoothly without touching the top lid.",
      audioDuration: "0:42",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      type: "text",
      content: "For the outer board, use same material as last time (we liked the 300 GSM Matte texture from batch ORD-0099).",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv1Id,
      senderId: "aarav_patel",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Please deliver by next Friday November 14th without delay.",
      source: "whatsapp",
    },
  ];

  dbData.conversations.push({
    _id: conv1Id,
    workspaceId,
    customerId: client1Id,
    clientId: client1Id,
    customerName: "Aarav Cosmetics",
    clientName: "Aarav Cosmetics",
    channel: "whatsapp",
    lastMessage: conv1Messages[conv1Messages.length - 1].content,
    lastMessageAt: conv1Messages[conv1Messages.length - 1].timestamp,
    messageCount: conv1Messages.length,
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  dbData.messages.push(...conv1Messages);

  // Conv 2: Mehta Naturals (Hinglish chat + Voice Note + Advance Paid)
  const conv2Id = generateObjectId();
  const conv2Messages = [
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv2Id,
      senderId: "rajesh_mehta",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Namaste Ishan ji, humein 500 corrugated mailer boxes chahiye e-commerce shipping ke liye.",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv2Id,
      senderId: "rajesh_mehta",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 47 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Size hoga 250x180x80 mm, 3-ply E-flute kraft board, black soy ink printing. Purely eco-friendly varnish chahiye.",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv2Id,
      senderId: "rajesh_mehta",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      type: "voice",
      content: "Advance payment of Rs 45,000 transfer kar diya hai NEFT se. Design approval bhi lock kar di hai. Production press schedule mein daal dijiye please.",
      transcript: "Advance payment of Rs 45,000 transfer kar diya hai NEFT se. Design approval bhi lock kar di hai. Production press schedule mein daal dijiye please.",
      audioDuration: "0:38",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv2Id,
      senderId: "rajesh_mehta",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Target delivery deadline is November 10th for the wellness festival.",
      source: "whatsapp",
    },
  ];

  dbData.conversations.push({
    _id: conv2Id,
    workspaceId,
    customerId: client2Id,
    clientId: client2Id,
    customerName: "Mehta Naturals",
    clientName: "Mehta Naturals",
    channel: "whatsapp",
    lastMessage: conv2Messages[conv2Messages.length - 1].content,
    lastMessageAt: conv2Messages[conv2Messages.length - 1].timestamp,
    messageCount: conv2Messages.length,
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  dbData.messages.push(...conv2Messages);

  // Conv 3: Saffron Luxe Sweets
  const conv3Id = generateObjectId();
  const conv3Messages = [
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv3Id,
      senderId: "vikram_singhania",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Need 1,200 festive Mithai presentation boxes for Diwali corporate hampers. 2mm Kappa greyboard with gold foil and satin ribbon.",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv3Id,
      senderId: "vikram_singhania",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Quote looks solid at ₹240/unit. Sending PO shortly.",
      source: "whatsapp",
    },
  ];

  dbData.conversations.push({
    _id: conv3Id,
    workspaceId,
    customerId: client3Id,
    clientId: client3Id,
    customerName: "Saffron Luxe Sweets",
    clientName: "Saffron Luxe Sweets",
    channel: "whatsapp",
    lastMessage: conv3Messages[1].content,
    lastMessageAt: conv3Messages[1].timestamp,
    messageCount: 2,
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  dbData.messages.push(...conv3Messages);

  // Conv 4: Urban Botanics
  const conv4Id = generateObjectId();
  const conv4Messages = [
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv4Id,
      senderId: "ananya_deshmukh",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Hey Ishan, need 2,500 units of 300 GSM Virgin Kraft monocartons with a die-cut window (85x85x160 mm).",
      source: "whatsapp",
    },
  ];

  dbData.conversations.push({
    _id: conv4Id,
    workspaceId,
    customerId: client4Id,
    clientId: client4Id,
    customerName: "Urban Botanics",
    clientName: "Urban Botanics",
    channel: "whatsapp",
    lastMessage: conv4Messages[0].content,
    lastMessageAt: conv4Messages[0].timestamp,
    messageCount: 1,
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  dbData.messages.push(...conv4Messages);

  // Conv 5: Kaveri Silk Sarees
  const conv5Id = generateObjectId();
  const conv5Messages = [
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv5Id,
      senderId: "lakshmi_narayanan",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      type: "voice",
      content: "Vanakkam Ishan, we require 800 premium rigid slide drawer boxes for our Kanchipuram wedding saree line. Outer wrap should be deep crimson woven silk texture with embossed gold lettering.",
      transcript: "Vanakkam Ishan, we require 800 premium rigid slide drawer boxes for our Kanchipuram wedding saree line. Outer wrap should be deep crimson woven silk texture with embossed gold lettering.",
      audioDuration: "0:51",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv5Id,
      senderId: "lakshmi_narayanan",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Dimensions should be 340 x 240 x 75 mm. Substrate 1200 GSM Kappa Board. Delivery deadline December 5th.",
      source: "whatsapp",
    },
  ];

  dbData.conversations.push({
    _id: conv5Id,
    workspaceId,
    customerId: client5Id,
    clientId: client5Id,
    customerName: "Kaveri Silk Sarees",
    clientName: "Kaveri Silk Sarees",
    channel: "whatsapp",
    lastMessage: conv5Messages[1].content,
    lastMessageAt: conv5Messages[1].timestamp,
    messageCount: conv5Messages.length,
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  dbData.messages.push(...conv5Messages);

  // Conv 6: Chai Point Artisan
  const conv6Id = generateObjectId();
  const conv6Messages = [
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv6Id,
      senderId: "sameer_verma",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Hi Ishan, we are launching our single-origin artisanal tea canisters.",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv6Id,
      senderId: "sameer_verma",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
      type: "text",
      content: "We need 3,000 units of Cylindrical Composite Canisters (90mm Dia x 140mm Height).",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv6Id,
      senderId: "sameer_verma",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      type: "voice",
      content: "Please ensure food-grade aluminum foil lining inside the paper tube, embossed gold tin lids, and 6-color UV offset printed label wrap with soft-touch finish.",
      transcript: "Please ensure food-grade aluminum foil lining inside the paper tube, embossed gold tin lids, and 6-color UV offset printed label wrap with soft-touch finish.",
      audioDuration: "0:45",
      source: "whatsapp",
    },
    {
      _id: generateObjectId(),
      workspaceId,
      conversationId: conv6Id,
      senderId: "sameer_verma",
      senderRole: "customer",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      type: "text",
      content: "Advance payment of Rs 1,50,000 transferred. Target delivery is November 25th.",
      source: "whatsapp",
    },
  ];

  dbData.conversations.push({
    _id: conv6Id,
    workspaceId,
    customerId: client6Id,
    clientId: client6Id,
    customerName: "Chai Point Artisan",
    clientName: "Chai Point Artisan",
    channel: "whatsapp",
    lastMessage: conv6Messages[conv6Messages.length - 1].content,
    lastMessageAt: conv6Messages[conv6Messages.length - 1].timestamp,
    messageCount: conv6Messages.length,
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  dbData.messages.push(...conv6Messages);

  // 5. 6 Orders Across Stages
  const order1Id = generateObjectId();
  const order2Id = generateObjectId();
  const order3Id = generateObjectId();
  const order4Id = generateObjectId();
  const order5Id = generateObjectId();
  const order6Id = generateObjectId();

  const orders = [
    {
      _id: order1Id,
      workspaceId,
      orderNumber: "ORD-0104",
      title: "500 Luxury Cosmetic Shoulder Boxes",
      customerId: client1Id,
      clientId: client1Id,
      customerName: "Aarav Cosmetics",
      clientName: "Aarav Cosmetics",
      conversationId: conv1Id,
      status: "NEEDS_REVIEW",
      lifecycleStage: "Enquiry",
      stage: "DRAFT",
      type: "manufacturing",
      orderType: "manufacturing",
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
      conflicts: [
        {
          field: "material",
          currentValue: "350 GSM White SBS board (from current chat)",
          historicalValue: "300 GSM Matte SBS board (from batch ORD-0099)",
          explanation: "Client stated '350 GSM White SBS board' in message #2, but later requested 'same material as last time' which was 300 GSM Matte SBS board in order ORD-0099.",
        },
      ],
      deadline: new Date(Date.now() + 11 * 24 * 3600 * 1000).toISOString(),
      hasConflicts: true,
      hasMissing: false,
      hasInferred: true,
      advancePaid: false,
      designApproved: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: order2Id,
      workspaceId,
      orderNumber: "ORD-0105",
      title: "500 E-Flute Corrugated Shipping Mailers",
      customerId: client2Id,
      clientId: client2Id,
      customerName: "Mehta Naturals",
      clientName: "Mehta Naturals",
      conversationId: conv2Id,
      status: "CONFIRMED",
      lifecycleStage: "Production",
      stage: "IN_PRODUCTION",
      type: "manufacturing",
      orderType: "manufacturing",
      quote: {
        status: "Accepted",
        currency: "INR",
        unitPrice: 90,
        quantity: 500,
        subtotal: 45000,
        tax: 8100,
        total: 53100,
        lineItems: [
          { name: "3-ply E-flute Kraft Self-Locking Mailer", quantity: 500, unitPrice: 65, total: 32500 },
          { name: "1-Color Soy Ink Screen Print", quantity: 500, unitPrice: 15, total: 7500 },
          { name: "Eco Water-Based Protective Varnish", quantity: 500, unitPrice: 10, total: 5000 },
        ],
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
      deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      hasConflicts: false,
      hasMissing: false,
      hasInferred: false,
      advancePaid: true,
      advanceAmount: 45000,
      designApproved: true,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: nowIso,
    },
    {
      _id: order3Id,
      workspaceId,
      orderNumber: "ORD-0106",
      title: "1,200 Book-Style Festive Sweet Presentation Boxes",
      customerId: client3Id,
      clientId: client3Id,
      customerName: "Saffron Luxe Sweets",
      clientName: "Saffron Luxe Sweets",
      conversationId: conv3Id,
      status: "NEEDS_REVIEW",
      lifecycleStage: "Design approved",
      stage: "QUOTE_SENT",
      type: "manufacturing",
      orderType: "manufacturing",
      quote: {
        status: "Sent",
        currency: "INR",
        unitPrice: 240,
        quantity: 1200,
        subtotal: 288000,
        tax: 51840,
        total: 339840,
        lineItems: [
          { name: "2mm Kappa Greyboard Book Box + 150 GSM Wrap", quantity: 1200, unitPrice: 160, total: 192000 },
          { name: "Soft-Touch Matte + Spot UV Logo", quantity: 1200, unitPrice: 50, total: 60000 },
          { name: "Satin Ribbon Pull & Magnetic Catch", quantity: 1200, unitPrice: 30, total: 36000 },
        ],
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
      deadline: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
      hasConflicts: false,
      hasMissing: false,
      hasInferred: true,
      advancePaid: false,
      designApproved: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: order4Id,
      workspaceId,
      orderNumber: "ORD-0107",
      title: "2,500 Kraft Window Monocartons",
      customerId: client4Id,
      clientId: client4Id,
      customerName: "Urban Botanics",
      clientName: "Urban Botanics",
      conversationId: conv4Id,
      status: "DRAFT",
      lifecycleStage: "Enquiry",
      stage: "DRAFT",
      type: "manufacturing",
      orderType: "manufacturing",
      currentFields: {
        productType: { value: "Folding Carton", status: "CONFIRMED", confidence: 1 },
        quantity: { value: 2500, status: "CONFIRMED", confidence: 1 },
        dimensions: { value: "85 x 85 x 160 mm", status: "CONFIRMED", confidence: 1 },
        material: { value: "300 GSM Virgin Kraft Board", status: "CONFIRMED", confidence: 1 },
        finish: { value: "Die-Cut Window with 100 Micron PVC Film", status: "CONFIRMED", confidence: 0.95 },
        printing: { value: "2-Color Soy Ink Screen Print", status: "CONFIRMED", confidence: 0.95 },
        deadline: { value: "Missing target deadline", status: "MISSING", confidence: 0 },
      },
      deadline: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
      hasConflicts: false,
      hasMissing: true,
      hasInferred: false,
      advancePaid: false,
      designApproved: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: order5Id,
      workspaceId,
      orderNumber: "ORD-0108",
      title: "800 Crimson Silk Slide Drawer Apparel Boxes",
      customerId: client5Id,
      clientId: client5Id,
      customerName: "Kaveri Silk Sarees",
      clientName: "Kaveri Silk Sarees",
      conversationId: conv5Id,
      status: "NEEDS_REVIEW",
      lifecycleStage: "Consultation",
      stage: "DRAFT",
      type: "manufacturing",
      orderType: "manufacturing",
      quote: {
        status: "Draft",
        currency: "INR",
        unitPrice: 380,
        quantity: 800,
        subtotal: 304000,
        tax: 54720,
        total: 358720,
      },
      currentFields: {
        productType: { value: "Rigid Drawer Box", status: "CONFIRMED", confidence: 1 },
        quantity: { value: 800, status: "CONFIRMED", confidence: 1 },
        dimensions: { value: "340 x 240 x 75 mm", status: "INFERRED", confidence: 0.85 },
        material: { value: "1200 GSM Kappa Board + Silk Fabric Wrap", status: "CONFIRMED", confidence: 0.95 },
        finish: { value: "Gold Embossed Lettering + Ribbon Pull", status: "CONFIRMED", confidence: 0.95 },
        printing: { value: "Hot Foil Stamped Logo", status: "CONFIRMED", confidence: 0.9 },
        deadline: { value: "December 5, 2026", status: "INFERRED", confidence: 0.8 },
      },
      deadline: new Date(Date.now() + 32 * 24 * 3600 * 1000).toISOString(),
      hasConflicts: false,
      hasMissing: false,
      hasInferred: true,
      advancePaid: false,
      designApproved: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: order6Id,
      workspaceId,
      orderNumber: "ORD-0109",
      title: "3,000 Cylindrical Composite Tea Canisters",
      customerId: client6Id,
      clientId: client6Id,
      customerName: "Chai Point Artisan",
      clientName: "Chai Point Artisan",
      conversationId: conv6Id,
      status: "CONFIRMED",
      lifecycleStage: "Production",
      stage: "DESIGN_REVIEW",
      type: "manufacturing",
      orderType: "manufacturing",
      quote: {
        status: "Accepted",
        currency: "INR",
        unitPrice: 110,
        quantity: 3000,
        subtotal: 330000,
        tax: 59400,
        total: 389400,
      },
      currentFields: {
        productType: { value: "Cylindrical Canister", status: "CONFIRMED", confidence: 1 },
        quantity: { value: 3000, status: "CONFIRMED", confidence: 1 },
        dimensions: { value: "90mm Dia x 140mm Height", status: "CONFIRMED", confidence: 1 },
        material: { value: "Composite Paper Tube + Food Foil Lining", status: "CONFIRMED", confidence: 1 },
        finish: { value: "Embossed Gold Tin Cap + Matte Label Wrap", status: "CONFIRMED", confidence: 0.95 },
        printing: { value: "6-Color UV Offset Printing", status: "CONFIRMED", confidence: 0.95 },
        deadline: { value: "November 25, 2026", status: "CONFIRMED", confidence: 1 },
      },
      deadline: new Date(Date.now() + 22 * 24 * 3600 * 1000).toISOString(),
      hasConflicts: false,
      hasMissing: false,
      hasInferred: false,
      advancePaid: true,
      advanceAmount: 150000,
      designApproved: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  dbData.orders.push(...orders);

  // Seed Order Events for all 6 orders
  const seedEvents = [
    // Order 1 (Aarav)
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[0].timestamp, field: "productType", newValue: "Rigid Box", status: "CONFIRMED", source: { messageId: conv1Messages[0]._id, quote: "custom rigid gift boxes" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[1].timestamp, field: "quantity", newValue: 100, status: "CONFIRMED", source: { messageId: conv1Messages[1]._id, quote: "Let's start with 100 boxes." }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[1].timestamp, field: "dimensions", newValue: "220 x 150 x 65 mm", status: "CONFIRMED", source: { messageId: conv1Messages[1]._id, quote: "Dimensions: 220x150x65 mm." }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[1].timestamp, field: "material", newValue: "350 GSM White SBS board", status: "CONFIRMED", source: { messageId: conv1Messages[1]._id, quote: "Use 350 GSM White SBS board" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[1].timestamp, field: "finish", newValue: "Gold Foil Stamping + Matte Lamination", status: "CONFIRMED", source: { messageId: conv1Messages[1]._id, quote: "gold foil logo stamping" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[2].timestamp, field: "quantity", previousValue: 100, newValue: 500, status: "CONFIRMED", source: { messageId: conv1Messages[2]._id, quote: "increase the quantity from 100 to 500 boxes!" }, actor: "ai", confirmation: "confirmed", note: "Delta update via voice note", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[2].timestamp, field: "dimensions", previousValue: "220 x 150 x 65 mm", newValue: "220 x 150 x 70 mm", status: "INFERRED", source: { messageId: conv1Messages[2]._id, quote: "make it 5mm taller (70mm)" }, actor: "ai", confirmation: "pending", note: "Relative dimension change", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[3].timestamp, field: "material", previousValue: "350 GSM White SBS board", newValue: "300 GSM Matte SBS board", status: "CONFLICTING", source: { messageId: conv1Messages[3]._id, quote: "same material as last time (we liked the 300 GSM Matte texture from batch ORD-0099)" }, actor: "ai", confirmation: "pending", note: "Historical reference conflict detected", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: conv1Messages[4].timestamp, field: "deadline", newValue: "November 14, 2026", status: "CONFIRMED", source: { messageId: conv1Messages[4]._id, quote: "deliver by next Friday November 14th" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order1Id, timestamp: nowIso, field: "stage_gate:design_approved", newValue: "Design Approved", status: "CONFIRMED", source: { quote: "Operator verified client artwork dielines" }, actor: "human", confirmation: "confirmed", note: "Design approved by operator", createdAt: nowIso },

    // Order 2 (Mehta)
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[0].timestamp, field: "productType", newValue: "Corrugated Mailer", status: "CONFIRMED", source: { messageId: conv2Messages[0]._id, quote: "500 corrugated mailer boxes" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[0].timestamp, field: "quantity", newValue: 500, status: "CONFIRMED", source: { messageId: conv2Messages[0]._id, quote: "500 corrugated mailer boxes" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[1].timestamp, field: "dimensions", newValue: "250 x 180 x 80 mm", status: "CONFIRMED", source: { messageId: conv2Messages[1]._id, quote: "Size hoga 250x180x80 mm" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[1].timestamp, field: "material", newValue: "3-ply E-flute Kraft Board", status: "CONFIRMED", source: { messageId: conv2Messages[1]._id, quote: "3-ply E-flute kraft board" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[1].timestamp, field: "printing", newValue: "1-Color Black Soy Ink Screen Print", status: "CONFIRMED", source: { messageId: conv2Messages[1]._id, quote: "black soy ink printing" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[1].timestamp, field: "finish", newValue: "Water-based Eco Varnish", status: "CONFIRMED", source: { messageId: conv2Messages[1]._id, quote: "eco-friendly varnish chahiye" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[2].timestamp, field: "stage_gate:advance_paid", newValue: "Advance Paid (₹45,000)", status: "CONFIRMED", source: { messageId: conv2Messages[2]._id, quote: "Advance payment of Rs 45,000 transfer kar diya hai NEFT se" }, actor: "human", confirmation: "confirmed", note: "Advance payment verified", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[2].timestamp, field: "stage_gate:design_approved", newValue: "Design Approved", status: "CONFIRMED", source: { messageId: conv2Messages[2]._id, quote: "Design approval bhi lock kar di hai" }, actor: "human", confirmation: "confirmed", note: "Design dieline approved", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order2Id, timestamp: conv2Messages[3].timestamp, field: "deadline", newValue: "November 10, 2026", status: "CONFIRMED", source: { messageId: conv2Messages[3]._id, quote: "delivery deadline is November 10th" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },

    // Order 3 (Saffron Luxe)
    { _id: generateObjectId(), workspaceId, orderId: order3Id, timestamp: conv3Messages[0].timestamp, field: "productType", newValue: "Book-Style Rigid Box", status: "CONFIRMED", source: { messageId: conv3Messages[0]._id, quote: "festive Mithai presentation boxes" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order3Id, timestamp: conv3Messages[0].timestamp, field: "quantity", newValue: 1200, status: "CONFIRMED", source: { messageId: conv3Messages[0]._id, quote: "Need 1,200 festive Mithai presentation boxes" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order3Id, timestamp: conv3Messages[0].timestamp, field: "material", newValue: "2mm Kappa Greyboard + 150 GSM Art Wrap", status: "CONFIRMED", source: { messageId: conv3Messages[0]._id, quote: "2mm Kappa greyboard with gold foil and satin ribbon" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order3Id, timestamp: conv3Messages[0].timestamp, field: "finish", newValue: "Soft-Touch Matte + Spot UV + Satin Pull", status: "CONFIRMED", source: { messageId: conv3Messages[0]._id, quote: "gold foil and satin ribbon" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order3Id, timestamp: conv3Messages[1].timestamp, field: "stage_gate:design_approved", newValue: "Design Approved", status: "CONFIRMED", source: { quote: "Operator verified festive dielines" }, actor: "human", confirmation: "confirmed", note: "Design approved by operator", createdAt: nowIso },

    // Order 4 (Urban Botanics)
    { _id: generateObjectId(), workspaceId, orderId: order4Id, timestamp: conv4Messages[0].timestamp, field: "productType", newValue: "Folding Carton", status: "CONFIRMED", source: { messageId: conv4Messages[0]._id, quote: "Kraft monocartons with a die-cut window" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order4Id, timestamp: conv4Messages[0].timestamp, field: "quantity", newValue: 2500, status: "CONFIRMED", source: { messageId: conv4Messages[0]._id, quote: "2,500 units" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order4Id, timestamp: conv4Messages[0].timestamp, field: "dimensions", newValue: "85 x 85 x 160 mm", status: "CONFIRMED", source: { messageId: conv4Messages[0]._id, quote: "(85x85x160 mm)" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order4Id, timestamp: conv4Messages[0].timestamp, field: "material", newValue: "300 GSM Virgin Kraft Board", status: "CONFIRMED", source: { messageId: conv4Messages[0]._id, quote: "300 GSM Virgin Kraft monocartons" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },

    // Order 5 (Kaveri Silk)
    { _id: generateObjectId(), workspaceId, orderId: order5Id, timestamp: conv5Messages[0].timestamp, field: "productType", newValue: "Rigid Drawer Box", status: "CONFIRMED", source: { messageId: conv5Messages[0]._id, quote: "rigid slide drawer boxes" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order5Id, timestamp: conv5Messages[0].timestamp, field: "quantity", newValue: 800, status: "CONFIRMED", source: { messageId: conv5Messages[0]._id, quote: "800 premium rigid slide drawer boxes" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order5Id, timestamp: conv5Messages[0].timestamp, field: "material", newValue: "1200 GSM Kappa Board + Silk Fabric Wrap", status: "CONFIRMED", source: { messageId: conv5Messages[0]._id, quote: "deep crimson woven silk texture" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },

    // Order 6 (Chai Point)
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[1].timestamp, field: "productType", newValue: "Cylindrical Canister", status: "CONFIRMED", source: { messageId: conv6Messages[1]._id, quote: "Cylindrical Composite Canisters" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[1].timestamp, field: "quantity", newValue: 3000, status: "CONFIRMED", source: { messageId: conv6Messages[1]._id, quote: "3,000 units" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[1].timestamp, field: "dimensions", newValue: "90mm Dia x 140mm Height", status: "CONFIRMED", source: { messageId: conv6Messages[1]._id, quote: "90mm Dia x 140mm Height" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[2].timestamp, field: "material", newValue: "Composite Paper Tube + Food Foil Lining", status: "CONFIRMED", source: { messageId: conv6Messages[2]._id, quote: "food-grade aluminum foil lining inside the paper tube" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[2].timestamp, field: "finish", newValue: "Embossed Gold Tin Cap + Matte Label Wrap", status: "CONFIRMED", source: { messageId: conv6Messages[2]._id, quote: "embossed gold tin lids, and 6-color UV offset" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[3].timestamp, field: "stage_gate:advance_paid", newValue: "Advance Paid (₹1,50,000)", status: "CONFIRMED", source: { messageId: conv6Messages[3]._id, quote: "Advance payment of Rs 1,50,000 transferred" }, actor: "human", confirmation: "confirmed", note: "Advance payment verified", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[3].timestamp, field: "stage_gate:design_approved", newValue: "Design Approved", status: "CONFIRMED", source: { quote: "Tooling fitment approved" }, actor: "human", confirmation: "confirmed", note: "Design approved by operator", createdAt: nowIso },
    { _id: generateObjectId(), workspaceId, orderId: order6Id, timestamp: conv6Messages[3].timestamp, field: "deadline", newValue: "November 25, 2026", status: "CONFIRMED", source: { messageId: conv6Messages[3]._id, quote: "Target delivery is November 25th" }, actor: "ai", confirmation: "confirmed", note: "Extracted via Gemma", createdAt: nowIso },
  ];

  dbData.order_events.push(...seedEvents);

  // 6. Production Brief (for confirmed order ORD-0105)
  dbData.production_briefs.push({
    _id: generateObjectId(),
    orderId: order2Id,
    workspaceId,
    versionNumber: 1,
    generatedAt: nowIso,
    status: "LOCKED_FOR_PRESS",
    specifications: {
      client: "Mehta Naturals",
      orderNumber: "ORD-0105",
      productType: "Corrugated E-Flute Mailer",
      quantity: 500,
      dimensions: "250 x 180 x 80 mm",
      material: "3-ply E-flute Kraft Board (180 GSM Top / 120 GSM Flute / 140 GSM Bottom)",
      printing: "1-Color Black Soy Ink Screen Print (Plate #MN-2026-A)",
      finish: "Protective Water-Based Matte Eco Varnish",
      dieCutting: "Standard Die Tool #KRAFT-250",
      palletizing: "Bundles of 25 flat-packed, shrink-wrapped with moisture barrier",
      specialInstructions: "Use certified food/skin safe soy ink only. No chemical solvent smells allowed.",
    },
  });

  // 7. Clarifications (Drafted by Gemma AI for missing information)
  dbData.clarifications.push({
    _id: generateObjectId(),
    orderId: order4Id,
    workspaceId,
    field: "deadline",
    question: "Hi Ananya, what is your target in-hand delivery deadline for the 2,500 Kraft Window Monocartons so we can reserve press time?",
    status: "open",
    createdAt: nowIso,
  });

  // 8. Schedule Events (Today Strip & Calendar)
  dbData.schedule_events.push(
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Dieline & Foam Fitment Review: Aarav Cosmetics",
      date: todayStr,
      time: "11:30 AM",
      type: "consultation",
      orderId: order1Id,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Advance Payment Verification: Mehta Naturals (₹45,000)",
      date: todayStr,
      time: "02:00 PM",
      type: "advance",
      orderId: order2Id,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Corrugated E-Flute Die Cutting Run #105 Start",
      date: todayStr,
      time: "04:30 PM",
      type: "deadline",
      orderId: order2Id,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Foil Stamping Block Approval: Kaveri Silk Sarees",
      date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
      time: "10:00 AM",
      type: "approval",
      orderId: order5Id,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Diwali Corporate Hamper Bulk Production Meeting",
      date: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10),
      time: "03:00 PM",
      type: "consultation",
      orderId: order3Id,
      createdAt: nowIso,
    }
  );

  // 9. Tasks & Pinned Notes
  dbData.tasks.push(
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Send revised foil block proof to Aarav Patel",
      assignedTo: "Ishan Kumar",
      status: "pending",
      dueAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      priority: "high",
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Verify E-flute board stock in bay #3 for Mehta order",
      assignedTo: "Press Operator",
      status: "completed",
      dueAt: nowIso,
      priority: "medium",
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Verify advance payment receipt for Saffron Luxe ₹1,50,000",
      assignedTo: "Accounts",
      status: "pending",
      dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      priority: "high",
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Test composite tube lid fitment for Chai Point 90mm canister",
      assignedTo: "Tooling Specialist",
      status: "pending",
      dueAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      priority: "medium",
      createdAt: nowIso,
    }
  );

  dbData.notes.push(
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Festive Season Foil Stamping Notice",
      content: "Spot Gold block stamping queue is currently at 48-hour turnaround. Remind luxury clients to approve dielines early.",
      pinned: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Kraft Paper Supplier Update",
      content: "Supplier confirmed 300 GSM Virgin Kraft reel delivery on Tuesday morning. Bay #2 reserved.",
      pinned: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      title: "Silk Fabric Lamination Guidelines",
      content: "Ensure hot-melt adhesive temperature does not exceed 110°C to prevent warping the Kanchipuram silk weave.",
      pinned: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
  );

  // 10. Customer Memory
  dbData.customer_memory.push(
    {
      _id: generateObjectId(),
      workspaceId,
      customerId: client1Id,
      fact: "Prefers magnetic catch closures over friction lids for perfume gift boxes.",
      kind: "preference",
      verified: true,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      customerId: client1Id,
      fact: "'Same as last time' refers to 300 GSM Matte SBS board from order ORD-0099.",
      kind: "shorthand",
      verified: true,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      customerId: client2Id,
      fact: "Always uses single color black soy ink on E-flute kraft for sustainability branding.",
      kind: "preference",
      verified: true,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      customerId: client3Id,
      fact: "Requires food-grade barrier liner for all mithai and sweet packaging boxes.",
      kind: "preference",
      verified: true,
      createdAt: nowIso,
    },
    {
      _id: generateObjectId(),
      workspaceId,
      customerId: client5Id,
      fact: "Requires gold satin ribbon pull of exactly 15mm width.",
      kind: "preference",
      verified: true,
      createdAt: nowIso,
    }
  );

  // 11. Company Brain
  const brainIndex = dbData.company_brain.findIndex((b) => b.workspaceId === workspaceId);
  const companyBrainDoc = {
    _id: generateObjectId(),
    workspaceId,
    materials: [
      { name: "350 GSM White SBS Board", pricePerSheet: 45, unit: "sheet", stock: 12000 },
      { name: "2mm Kappa Greyboard", pricePerSheet: 85, unit: "sheet", stock: 5500 },
      { name: "3-ply E-flute Kraft", pricePerSheet: 28, unit: "sheet", stock: 18000 },
      { name: "300 GSM Virgin Kraft", pricePerSheet: 38, unit: "sheet", stock: 9000 },
      { name: "1200 GSM Rigid Kappa Board", pricePerSheet: 110, unit: "sheet", stock: 4000 },
      { name: "Composite Paper Core (90mm)", pricePerSheet: 42, unit: "tube", stock: 6500 },
    ],
    finishes: [
      { name: "Hot Foil Stamping (Gold/Silver)", setupCost: 1500, perUnitCost: 4.5 },
      { name: "Soft-Touch Matte Lamination", setupCost: 800, perUnitCost: 2.8 },
      { name: "Spot UV Gloss Coating", setupCost: 1200, perUnitCost: 3.5 },
      { name: "Custom Die Cutting & Creasing", setupCost: 2500, perUnitCost: 1.5 },
      { name: "Embossed / Debossed Lettering", setupCost: 1800, perUnitCost: 2.0 },
    ],
    outOfScopeItems: [
      "Logo design from scratch",
      "Marketing & advertising copy writing",
      "Product photography & video shoots",
      "Social media brand strategy",
    ],
    updatedAt: nowIso,
  };

  if (brainIndex >= 0) {
    dbData.company_brain[brainIndex] = companyBrainDoc;
  } else {
    dbData.company_brain.push(companyBrainDoc);
  }

  // Save to db.json
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");

  console.log(`\n===================================================================`);
  console.log(`✓ SUCCESSFULLY POPULATED INTHEBOX PACKAGING WORKSPACE!`);
  console.log(`  Login Email: ishan@inthebox.pack (or demo@ordermind.pack)`);
  console.log(`  Password:    password123`);
  console.log(`  Workspace:   InTheBox Packaging Studio (${workspaceId})`);
  console.log(`  Clients:     6 Packaging Clients (Aarav, Mehta, Saffron, Urban, Kaveri, Chai Point)`);
  console.log(`  Orders:      6 Orders across DRAFT, NEEDS_REVIEW, QUOTE_SENT, IN_PRODUCTION`);
  console.log(`  Multi-modal: WhatsApp chats, Voice Notes with transcripts, Audio duration`);
  console.log(`===================================================================`);
}

seedRichIshanData();
