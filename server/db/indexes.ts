import { getDb } from "./mongodb";

export interface IndexDefinition {
  collection: string;
  keys: Record<string, 1 | -1 | "text">;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    name?: string;
  };
}

export const REQUIRED_INDEXES: IndexDefinition[] = [
  // Users & Auth
  { collection: "users", keys: { email: 1 }, options: { unique: true, name: "users_email_unique" } },
  { collection: "members", keys: { workspaceId: 1, userId: 1 }, options: { unique: true, name: "members_workspace_user_unique" } },
  { collection: "members", keys: { userId: 1 }, options: { name: "members_userId" } },
  
  // Workspaces
  { collection: "workspaces", keys: { createdAt: -1 }, options: { name: "workspaces_createdAt" } },

  // Clients & CRM
  { collection: "clients", keys: { workspaceId: 1, name: 1 }, options: { name: "clients_workspace_name" } },
  { collection: "clients", keys: { workspaceId: 1, updatedAt: -1 }, options: { name: "clients_workspace_updatedAt" } },

  // Conversations & Dumps
  { collection: "conversations", keys: { workspaceId: 1, clientId: 1 }, options: { name: "conversations_workspace_client" } },
  { collection: "conversations", keys: { workspaceId: 1, updatedAt: -1 }, options: { name: "conversations_workspace_updatedAt" } },
  { collection: "messages", keys: { conversationId: 1, timestamp: 1 }, options: { name: "messages_conversation_timestamp" } },
  { collection: "messages", keys: { workspaceId: 1, timestamp: -1 }, options: { name: "messages_workspace_timestamp" } },
  { collection: "extracted_events", keys: { conversationId: 1, messageId: 1 }, options: { name: "events_conv_message" } },

  // Orders & Matrix
  { collection: "orders", keys: { workspaceId: 1, orderNumber: 1 }, options: { name: "orders_workspace_orderNumber" } },
  { collection: "orders", keys: { workspaceId: 1, stage: 1, type: 1 }, options: { name: "orders_workspace_stage_type" } },
  { collection: "orders", keys: { workspaceId: 1, clientId: 1 }, options: { name: "orders_workspace_client" } },
  { collection: "orders", keys: { workspaceId: 1, deadline: 1 }, options: { name: "orders_workspace_deadline" } },
  { collection: "orders", keys: { workspaceId: 1, updatedAt: -1 }, options: { name: "orders_workspace_updatedAt" } },
  { collection: "order_events", keys: { orderId: 1, timestamp: 1 }, options: { name: "order_events_order_timestamp" } },

  // Tasks, Notes, Calendar, Memory
  { collection: "tasks", keys: { workspaceId: 1, status: 1, dueAt: 1 }, options: { name: "tasks_workspace_status_dueAt" } },
  { collection: "notes", keys: { workspaceId: 1, pinned: -1, updatedAt: -1 }, options: { name: "notes_workspace_pinned_updated" } },
  { collection: "schedule_events", keys: { workspaceId: 1, date: 1 }, options: { name: "schedule_workspace_date" } },
  { collection: "customer_memory", keys: { workspaceId: 1, customerId: 1 }, options: { name: "memory_workspace_customer" } },
  { collection: "company_brain", keys: { workspaceId: 1 }, options: { unique: true, name: "brain_workspace_unique" } },

  // Attachments
  { collection: "attachments", keys: { workspaceId: 1, uploadedAt: -1 }, options: { name: "attachments_workspace_uploadedAt" } },
];

/**
 * Ensures all compound indexes are created idempotently on startup or migration.
 */
export async function ensureIndexes(): Promise<{ created: number; skipped: number; errors: string[] }> {
  const db = await getDb();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const idx of REQUIRED_INDEXES) {
    try {
      await db.collection(idx.collection).createIndex(idx.keys as any, idx.options || {});
      created++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        skipped++;
      } else {
        errors.push(`Failed index on ${idx.collection}: ${msg}`);
      }
    }
  }

  return { created, skipped, errors };
}
