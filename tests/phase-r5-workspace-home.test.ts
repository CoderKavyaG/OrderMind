import { describe, it, expect, beforeEach, vi } from "vitest";
import { ObjectId } from "mongodb";
import {
  getWorkspaceDashboardData,
} from "@/server/services/workspaceHome.service";
import {
  createNote,
  listNotes,
  updateNote,
  deleteNote,
  createTask,
  listTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "@/server/services/notesTasks.service";

// Mock MongoDB collections in-memory
const mockDbState: Record<string, any[]> = {
  tasks: [],
  orders: [],
  customers: [],
  conversations: [],
  extracted_events: [],
  notes: [],
  company_brain: [],
};

vi.mock("@/server/db/mongodb", () => ({
  getDb: vi.fn(async () => ({
    collection: (name: string) => ({
      find: (query: Record<string, any> = {}) => ({
        sort: () => ({
          toArray: async () => {
            const list = mockDbState[name] || [];
            return list.filter((item) => {
              for (const key of Object.keys(query)) {
                if (query[key] === undefined) continue;
                if (key === "_id") {
                  if (item._id?.toString() !== query._id?.toString()) return false;
                } else if (item[key] !== query[key]) {
                  return false;
                }
              }
              return true;
            });
          },
        }),
        toArray: async () => {
          const list = mockDbState[name] || [];
          return list.filter((item) => {
            for (const key of Object.keys(query)) {
              if (query[key] === undefined) continue;
              if (key === "_id") {
                if (item._id?.toString() !== query._id?.toString()) return false;
              } else if (item[key] !== query[key]) {
                return false;
              }
            }
            return true;
          });
        },
      }),
      findOne: async (query: Record<string, any>) => {
        const list = mockDbState[name] || [];
        return (
          list.find((item) => {
            for (const key of Object.keys(query)) {
              if (query[key] === undefined) continue;
              if (key === "_id") {
                if (item._id?.toString() !== query._id?.toString()) return false;
              } else if (item[key] !== query[key]) {
                return false;
              }
            }
            return true;
          }) || null
        );
      },
      insertOne: async (doc: any) => {
        const _id = new ObjectId();
        const item = { ...doc, _id };
        if (!mockDbState[name]) mockDbState[name] = [];
        mockDbState[name].push(item);
        return { insertedId: _id };
      },
      updateOne: async (query: Record<string, any>, update: Record<string, any>) => {
        const list = mockDbState[name] || [];
        const item = list.find((i) => {
          if (query._id && i._id.toString() !== query._id.toString()) return false;
          if (query.workspaceId && i.workspaceId !== query.workspaceId) return false;
          return true;
        });
        if (item && update.$set) {
          Object.assign(item, update.$set);
        }
        return { modifiedCount: item ? 1 : 0 };
      },
      deleteOne: async (query: Record<string, any>) => {
        const list = mockDbState[name] || [];
        const idx = list.findIndex((i) => {
          if (query._id && i._id.toString() !== query._id.toString()) return false;
          if (query.workspaceId && i.workspaceId !== query.workspaceId) return false;
          return true;
        });
        if (idx !== -1) {
          list.splice(idx, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
    }),
  })),
}));

describe("Phase R5: Workspace Home & Operations Dashboard Service", () => {
  const testWorkspaceId = "ws_home_test_123";

  beforeEach(() => {
    // Reset in-memory collections
    for (const key of Object.keys(mockDbState)) {
      mockDbState[key] = [];
    }
  });

  it("returns clean empty states and 0-counts for a brand new empty workspace", async () => {
    const data = await getWorkspaceDashboardData(testWorkspaceId);

    // Today strip
    expect(data.todayStrip.totalToday).toBe(0);
    expect(data.todayStrip.deadlinesCount).toBe(0);
    expect(data.todayStrip.followupsCount).toBe(0);
    expect(data.todayStrip.approvalsCount).toBe(0);
    expect(data.todayStrip.paymentsCount).toBe(0);
    expect(data.todayStrip.consultationsCount).toBe(0);

    // Needs attention queue
    expect(data.needsAttentionQueue).toHaveLength(0);

    // Pipeline
    expect(data.pipelineStats.totalActive).toBe(0);
    expect(data.pipelineStats.totalConfirmed).toBe(0);
    expect(data.pipelineStats.totalEstimatedValueINR).toBe(0);

    // Feeds & notes
    expect(data.activeClientFeeds).toHaveLength(0);
    expect(data.pinnedNotes).toHaveLength(0);

    // Onboarding checklist
    expect(data.onboardingChecklist.isAllCompleted).toBe(false);
    expect(data.onboardingChecklist.completedCount).toBe(0);
    expect(data.onboardingChecklist.progressPercent).toBe(0);
    expect(data.onboardingChecklist.steps).toHaveLength(5);
  });

  it("calculates Today strip correctly with deadlines, follow-ups, approvals, and consultations", async () => {
    const now = new Date();
    const todayMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

    mockDbState.tasks = [
      {
        _id: new ObjectId(),
        workspaceId: testWorkspaceId,
        type: "deadline",
        title: "Rigid box die-cut delivery",
        dueAt: todayMorning,
        done: false,
      },
      {
        _id: new ObjectId(),
        workspaceId: testWorkspaceId,
        type: "followup",
        title: "Confirm foil color with Aarav",
        dueAt: todayMorning,
        done: false,
      },
      {
        _id: new ObjectId(),
        workspaceId: testWorkspaceId,
        type: "approval",
        title: "Await dieline signoff",
        dueAt: todayMorning,
        done: false,
      },
      {
        _id: new ObjectId(),
        workspaceId: testWorkspaceId,
        type: "payment",
        title: "Advance 50% deposit",
        dueAt: todayMorning,
        done: false,
      },
      {
        _id: new ObjectId(),
        workspaceId: testWorkspaceId,
        type: "consultation",
        title: "Packaging structural review call",
        dueAt: todayMorning,
        done: false,
      },
      {
        _id: new ObjectId(),
        workspaceId: testWorkspaceId,
        type: "followup",
        title: "Completed yesterday task",
        dueAt: todayMorning,
        done: true, // should be excluded from today's pending strip
      },
    ];

    const data = await getWorkspaceDashboardData(testWorkspaceId);

    expect(data.todayStrip.totalToday).toBe(5);
    expect(data.todayStrip.deadlinesCount).toBe(1);
    expect(data.todayStrip.followupsCount).toBe(1);
    expect(data.todayStrip.approvalsCount).toBe(1);
    expect(data.todayStrip.paymentsCount).toBe(1);
    expect(data.todayStrip.consultationsCount).toBe(1);
  });

  it("ranks Needs-Attention queue by urgency (overdue > conflict > missing > stage gates)", async () => {
    const pastDeadline = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    mockDbState.customers = [
      { _id: new ObjectId("650000000000000000000001"), workspaceId: testWorkspaceId, name: "Aarav Prints" },
      { _id: new ObjectId("650000000000000000000002"), workspaceId: testWorkspaceId, name: "Apex Sweets" },
    ];

    mockDbState.orders = [
      // 1. Awaiting advance (score 50)
      {
        _id: new ObjectId("650000000000000000000011"),
        workspaceId: testWorkspaceId,
        customerId: "650000000000000000000001",
        orderNumber: "ORD-001",
        lifecycleStage: "Design approved",
        orderType: "manufacturing",
        status: "DRAFT",
        currentFields: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // 2. Overdue order (score 100) with complete fields so only overdue triggers
      {
        _id: new ObjectId("650000000000000000000012"),
        workspaceId: testWorkspaceId,
        customerId: "650000000000000000000002",
        orderNumber: "ORD-002",
        lifecycleStage: "Production",
        orderType: "manufacturing",
        status: "CONFIRMED",
        currentFields: {
          productType: { value: "Rigid Box", status: "CONFIRMED" },
          quantity: { value: 500, status: "CONFIRMED" },
          dimensions: { value: "8x6x2 in", status: "CONFIRMED" },
          material: { value: "350 GSM SBS", status: "CONFIRMED" },
          finish: { value: "Matte", status: "CONFIRMED" },
          printing: { value: "Offset 4C", status: "CONFIRMED" },
          deadline: { value: pastDeadline, status: "CONFIRMED" },
        },
        createdAt: threeDaysAgo,
        updatedAt: new Date(),
      },
      // 3. Conflicting order (score 90)
      {
        _id: new ObjectId("650000000000000000000013"),
        workspaceId: testWorkspaceId,
        customerId: "650000000000000000000001",
        orderNumber: "ORD-003",
        lifecycleStage: "Enquiry",
        orderType: "manufacturing",
        status: "NEEDS_REVIEW",
        currentFields: {
          material: { value: "350 GSM Gloss", status: "CONFLICTING" },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const data = await getWorkspaceDashboardData(testWorkspaceId);

    expect(data.needsAttentionQueue).toHaveLength(3);
    // Highest urgency should be #1 (Overdue)
    expect(data.needsAttentionQueue[0].reasonType).toBe("overdue");
    expect(data.needsAttentionQueue[0].urgencyLevel).toBe("critical");
    expect(data.needsAttentionQueue[0].urgencyScore).toBe(100);

    // Second should be #2 (Conflict)
    expect(data.needsAttentionQueue[1].reasonType).toBe("conflict");
    expect(data.needsAttentionQueue[1].urgencyScore).toBe(90);

    // Third should be #3 (Awaiting Advance)
    expect(data.needsAttentionQueue[2].reasonType).toBe("awaiting_advance");
    expect(data.needsAttentionQueue[2].urgencyScore).toBe(50);
  });

  it("handles Task Schedule Events and Note CRUD with pinned toggling", async () => {
    // 1. Create task
    const task = await createTask(testWorkspaceId, {
      type: "deadline",
      title: "Deliver sample prototype",
      dueAt: new Date(),
    });
    expect(task.title).toBe("Deliver sample prototype");
    expect(task.done).toBe(false);

    // 2. Update task status
    const updatedTask = await updateTaskStatus(testWorkspaceId, task.id, true);
    expect(updatedTask.done).toBe(true);

    // 3. Create Note
    const note = await createNote(testWorkspaceId, {
      scope: "workspace",
      content: "Check Kappa board grain direction before scoring.",
      pinned: true,
    });
    expect(note.content).toContain("Kappa board");
    expect(note.pinned).toBe(true);

    // 4. Update Note Pin
    const unpinnedNote = await updateNote(testWorkspaceId, note.id, { pinned: false });
    expect(unpinnedNote?.pinned).toBe(false);

    // 5. Delete Note & Task
    const deletedNote = await deleteNote(testWorkspaceId, note.id);
    expect(deletedNote).toBe(true);

    const deletedTask = await deleteTask(testWorkspaceId, task.id);
    expect(deletedTask).toBe(true);
  });
});
