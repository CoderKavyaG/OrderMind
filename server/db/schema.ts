import { z } from "zod";
import { ObjectId } from "mongodb";

export const UserRoleSchema = z.enum(["OWNER", "ADMIN", "OPERATOR"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  email: z.string().email(),
  passwordHash: z.string(),
  name: z.string().min(1),
  activeWorkspaceId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type User = z.infer<typeof UserSchema>;

export const WorkspaceSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string().min(1),
  industry: z.string().default("Packaging"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const MemberSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  userId: z.string(),
  role: UserRoleSchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Member = z.infer<typeof MemberSchema>;

// Phase 2+3: Normalized Message & Channel types
export const MessageSourceSchema = z.enum(["manual", "whatsapp", "instagram"]);
export type MessageSource = z.infer<typeof MessageSourceSchema>;

export const SenderRoleSchema = z.enum(["customer", "business"]);
export type SenderRole = z.infer<typeof SenderRoleSchema>;

export const MessageTypeSchema = z.enum(["text", "image", "voice", "pdf"]);
export type MessageType = z.infer<typeof MessageTypeSchema>;

export const AttachmentMetaSchema = z.object({
  id: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(10 * 1024 * 1024, "File size must not exceed 10MB"),
  url: z.string().optional(),
});
export type AttachmentMeta = z.infer<typeof AttachmentMetaSchema>;

export const NormalizedMessageSchema = z.object({
  source: MessageSourceSchema,
  conversationId: z.string(),
  senderId: z.string(),
  senderRole: SenderRoleSchema,
  timestamp: z.date(),
  type: MessageTypeSchema,
  content: z.string(),
  attachments: z.array(AttachmentMetaSchema).default([]),
});
export type NormalizedMessage = z.infer<typeof NormalizedMessageSchema>;

export const CustomerSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  company: z.string().optional(),
  instagram: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Customer = z.infer<typeof CustomerSchema>;

// R1: Client Model (alias & extension of Customer)
export const ClientSchema = CustomerSchema;
export type Client = z.infer<typeof ClientSchema>;

// R1: Brand Model
export const BrandSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  clientId: z.string(),
  name: z.string().min(1),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Brand = z.infer<typeof BrandSchema>;

// R1: Product / SKU Model
export const ProductSkuSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  brandId: z.string(),
  name: z.string().min(1),
  structure: z.string().min(1),
  dimensions: z.string().min(1),
  materials: z.string().min(1),
  finish: z.string().min(1),
  accessories: z.string().optional(),
  photos: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().optional(),
      })
    )
    .default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type ProductSku = z.infer<typeof ProductSkuSchema>;

export const ConversationSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  customerId: z.string(),
  channelId: z.string().optional(),
  title: z.string().min(1),
  source: MessageSourceSchema.default("manual"),
  lastMessageAt: z.date().default(() => new Date()),
  lastMessagePreview: z.string().default(""),
  messageCount: z.number().default(0),
  status: z.enum(["open", "closed"]).default("open"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const MessageDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  conversationId: z.string(),
  source: MessageSourceSchema,
  senderId: z.string(),
  senderRole: SenderRoleSchema,
  timestamp: z.date(),
  type: MessageTypeSchema,
  content: z.string(),
  transcript: z.string().optional(),
  attachments: z.array(AttachmentMetaSchema).default([]),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
});
export type MessageDoc = z.infer<typeof MessageDocSchema>;

export const ChannelSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  type: MessageSourceSchema,
  name: z.string(),
  status: z.enum(["active", "coming_soon"]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Channel = z.infer<typeof ChannelSchema>;

// R1: Ingest Jobs
export const IngestJobStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
export type IngestJobStatus = z.infer<typeof IngestJobStatusSchema>;

export const IngestJobSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  source: MessageSourceSchema,
  status: IngestJobStatusSchema.default("pending"),
  rawPayload: z.unknown().optional(),
  error: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type IngestJob = z.infer<typeof IngestJobSchema>;

// Phase 4: Gemma Extraction Pipeline & ExtractedEvent
export const PACKAGING_FIELDS = [
  "product_type",
  "quantity",
  "length",
  "width",
  "height",
  "dimensions",
  "material",
  "gsm",
  "finish",
  "printing",
  "logo_placement",
  "accessories",
  "deadline",
  "special_instructions",
] as const;

export const PackagingFieldSchema = z.enum(PACKAGING_FIELDS);
export type PackagingField = z.infer<typeof PackagingFieldSchema>;

export const EventOpSchema = z.enum(["set", "delta", "ref"]);
export type EventOp = z.infer<typeof EventOpSchema>;

export const ExtractedEventSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  conversationId: z.string(),
  messageId: z.string(),
  field: z.string(),
  value: z.union([z.string(), z.number(), z.record(z.unknown()), z.array(z.unknown())]),
  unit: z.string().optional(),
  op: EventOpSchema,
  rawPhrase: z.string().optional(),
  quote: z.string(),
  confidence: z.number().min(0).max(1),
  stage: z.enum(["field_extraction", "reference_interpretation", "image_vision"]).optional(),
  createdAt: z.date().default(() => new Date()),
});
export type ExtractedEvent = z.infer<typeof ExtractedEventSchema>;

// Phase 5 & R1: Order State Engine & Lifecycle Stage Model
export const OrderStatusSchema = z.enum(["DRAFT", "NEEDS_REVIEW", "CONFIRMED"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderTypeSchema = z.enum(["consultation", "design", "manufacturing"]);
export type OrderType = z.infer<typeof OrderTypeSchema>;

export const OrderLifecycleStageSchema = z.enum([
  "Enquiry",
  "Consultation",
  "Design",
  "Design approved",
  "Advance paid",
  "Sample",
  "Production",
  "Delivered",
  "Cancelled",
]);
export type OrderLifecycleStage = z.infer<typeof OrderLifecycleStageSchema>;

export const REQUIRED_FIELDS_BY_ORDER_TYPE: Record<OrderType, string[]> = {
  consultation: ["consultationTier", "duration", "scheduledDate"],
  design: ["designTier", "skuName", "conceptsCount"],
  manufacturing: [
    "productType",
    "quantity",
    "dimensions",
    "material",
    "finish",
    "printing",
    "deadline",
  ],
};

export const FieldStatusSchema = z.enum(["CONFIRMED", "INFERRED", "MISSING", "CONFLICTING"]);
export type FieldStatus = z.infer<typeof FieldStatusSchema>;

export const OrderEventActorSchema = z.enum(["ai", "human"]);
export type OrderEventActor = z.infer<typeof OrderEventActorSchema>;

export const OrderEventConfirmationSchema = z.enum(["pending", "confirmed", "rejected"]);
export type OrderEventConfirmation = z.infer<typeof OrderEventConfirmationSchema>;

export const OrderEventDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  orderId: z.string(),
  timestamp: z.date().default(() => new Date()),
  field: z.string(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown(),
  unit: z.string().optional(),
  status: FieldStatusSchema,
  source: z.object({
    messageId: z.string().optional(),
    quote: z.string().optional(),
  }),
  actor: OrderEventActorSchema,
  confirmation: OrderEventConfirmationSchema.default("pending"),
  note: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});
export type OrderEventDoc = z.infer<typeof OrderEventDocSchema>;

export const QuoteStatusSchema = z.enum(["Draft", "Sent", "Accepted"]);
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;

export const QuoteLineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number().default(1),
  unitPriceINR: z.number(),
  totalINR: z.number(),
});
export type QuoteLineItem = z.infer<typeof QuoteLineItemSchema>;

export const OrderQuoteDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  orderId: z.string(),
  status: QuoteStatusSchema.default("Draft"),
  lineItems: z.array(QuoteLineItemSchema).default([]),
  materialCostINR: z.number().default(0),
  finishCostINR: z.number().default(0),
  accessoriesCostINR: z.number().default(0),
  totalINR: z.number().default(0),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type OrderQuoteDoc = z.infer<typeof OrderQuoteDocSchema>;

export const OrderDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  customerId: z.string(),
  brandId: z.string().optional(),
  conversationId: z.string(),
  orderNumber: z.string(),
  orderType: OrderTypeSchema.default("manufacturing"),
  lifecycleStage: OrderLifecycleStageSchema.default("Enquiry"),
  status: OrderStatusSchema.default("DRAFT"),
  currentFields: z.record(z.unknown()).default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type OrderDoc = z.infer<typeof OrderDocSchema>;

export const OrderVersionDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  workspaceId: z.string(),
  orderId: z.string(),
  versionNumber: z.number(),
  snapshot: z.record(z.unknown()),
  confirmedBy: z.string(),
  createdAt: z.date().default(() => new Date()),
});
export type OrderVersionDoc = z.infer<typeof OrderVersionDocSchema>;

// Phase 6: Clarifications & Conflict Resolution
export const ClarificationStatusSchema = z.enum(["open", "answered", "dismissed"]);
export type ClarificationStatus = z.infer<typeof ClarificationStatusSchema>;

export const ClarificationDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  orderId: z.string(),
  field: z.string(),
  fieldLabel: z.string().optional(),
  question: z.string(),
  status: ClarificationStatusSchema.default("open"),
  customerReply: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  answeredAt: z.date().optional(),
});
export type ClarificationDoc = z.infer<typeof ClarificationDocSchema>;

// Phase 5b: Customer Memory & History
export const MemoryKindSchema = z.enum(["preference", "shorthand", "pattern", "rule"]);
export type MemoryKind = z.infer<typeof MemoryKindSchema>;

export const CustomerMemoryDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  customerId: z.string(),
  brandId: z.string().optional(),
  fact: z.string(),
  kind: MemoryKindSchema.default("preference"),
  source: z.object({
    orderId: z.string().optional(),
    messageId: z.string().optional(),
    note: z.string().optional(),
  }),
  verified: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type CustomerMemoryDoc = z.infer<typeof CustomerMemoryDocSchema>;

// R1: Notes Scoped by Workspace, Client, or Order
export const NoteScopeSchema = z.enum(["workspace", "client", "order"]);
export type NoteScope = z.infer<typeof NoteScopeSchema>;

export const NoteSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  scope: NoteScopeSchema,
  targetId: z.string().optional(),
  content: z.string().min(1),
  pinned: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Note = z.infer<typeof NoteSchema>;

// R1: Tasks & Schedule Events
export const TaskTypeSchema = z.enum([
  "deadline",
  "followup",
  "approval",
  "payment",
  "consultation",
  "production",
]);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const TaskScheduleEventSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  type: TaskTypeSchema,
  title: z.string().min(1),
  dueAt: z.date(),
  orderId: z.string().optional(),
  clientId: z.string().optional(),
  done: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type TaskScheduleEvent = z.infer<typeof TaskScheduleEventSchema>;

// R1: Company Brain for InTheBox
export const BrainServiceSchema = z.object({
  id: z.string(),
  category: z.enum(["consultation", "design", "manufacturing"]),
  name: z.string(),
  description: z.string(),
  pricingModel: z.enum(["fixed", "quote_only"]),
  basePriceINR: z.number().nullable(),
  deliverables: z.array(z.string()).default([]),
});
export type BrainService = z.infer<typeof BrainServiceSchema>;

export const BrainPriceEntrySchema = z.object({
  tierId: z.string(),
  category: z.enum(["consultation", "design", "manufacturing"]),
  name: z.string(),
  priceINR: z.number().nullable(),
  billingUnit: z.string(),
  notes: z.string().optional(),
});
export type BrainPriceEntry = z.infer<typeof BrainPriceEntrySchema>;

export const CompanyBrainSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  version: z.number().default(1),
  services: z.array(BrainServiceSchema),
  priceTable: z.array(BrainPriceEntrySchema),
  materials: z.array(z.string()),
  finishes: z.array(z.string()),
  accessories: z.array(z.string()),
  policies: z.array(z.string()),
  outOfScope: z.array(z.string()),
  updatedAt: z.date().default(() => new Date()),
});
export type CompanyBrain = z.infer<typeof CompanyBrainSchema>;

// Phase 7: Production Brief
export const ProductionBriefDocSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  workspaceId: z.string(),
  orderId: z.string(),
  versionId: z.string(),
  versionNumber: z.number(),
  generatedAt: z.date().default(() => new Date()),
  content: z.object({
    customerName: z.string(),
    orderNumber: z.string(),
    productType: z.string(),
    quantity: z.union([z.string(), z.number()]),
    dimensions: z.string(),
    material: z.string(),
    printing: z.string(),
    finish: z.string(),
    accessories: z.string().optional(),
    deadline: z.string(),
    referenceFiles: z
      .array(
        z.object({
          name: z.string(),
          attachmentId: z.string(),
          mimeType: z.string(),
        })
      )
      .default([]),
    specialInstructions: z.string().optional(),
    footer: z.string(),
  }),
});
export type ProductionBriefDoc = z.infer<typeof ProductionBriefDocSchema>;
