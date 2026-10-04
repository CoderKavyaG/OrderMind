import { describe, it, expect, vi, beforeEach } from "vitest";
import { signToken } from "@/server/auth/jwt";

// Mock mongodb and next/headers for requireWorkspace
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/server/db/mongodb", () => {
  const usersCollection = {
    findOne: vi.fn(),
  };
  const membersCollection = {
    findOne: vi.fn(),
  };
  const workspacesCollection = {
    findOne: vi.fn(),
  };
  const db = {
    collection: (name: string) => {
      if (name === "users") return usersCollection;
      if (name === "members") return membersCollection;
      if (name === "workspaces") return workspacesCollection;
      return {};
    },
  };
  return {
    getDb: vi.fn().mockResolvedValue(db),
  };
});

import { cookies } from "next/headers";
import { getDb } from "@/server/db/mongodb";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { ObjectId } from "mongodb";

describe("Tenant Isolation (requireWorkspace)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 401 when no session cookie is provided", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => undefined,
    });

    await expect(requireWorkspace()).rejects.toThrow("Authentication required");
  });

  it("throws 401 on tampered or invalid JWT token", async () => {
    (cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => ({ value: "invalid-tampered-token" }),
    });

    await expect(requireWorkspace()).rejects.toThrow("Invalid or expired session token");
  });

  it("blocks User A from accessing Workspace B when no membership exists", async () => {
    const userAId = new ObjectId().toString();
    const workspaceBId = new ObjectId().toString();

    const validToken = await signToken({
      userId: userAId,
      email: "usera@example.com",
      workspaceId: workspaceBId,
    });

    (cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => ({ value: validToken }),
    });

    const db = await getDb();
    const users = db.collection("users");
    const members = db.collection("members");

    (users.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: new ObjectId(userAId),
      email: "usera@example.com",
      name: "User A",
    });

    // Membership in workspace B does NOT exist
    (members.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(requireWorkspace(workspaceBId)).rejects.toThrow(
      "No workspace membership found"
    );
  });

  it("successfully returns verified tenant context for authorized member", async () => {
    const userAId = new ObjectId().toString();
    const workspaceAId = new ObjectId().toString();

    const validToken = await signToken({
      userId: userAId,
      email: "usera@example.com",
      workspaceId: workspaceAId,
    });

    (cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => ({ value: validToken }),
    });

    const db = await getDb();
    const users = db.collection("users");
    const members = db.collection("members");
    const workspaces = db.collection("workspaces");

    (users.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: new ObjectId(userAId),
      email: "usera@example.com",
      name: "User A",
    });

    (members.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: new ObjectId(),
      userId: userAId,
      workspaceId: workspaceAId,
      role: "OWNER",
    });

    (workspaces.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: new ObjectId(workspaceAId),
      name: "User A Packaging Co.",
      industry: "Packaging",
    });

    const context = await requireWorkspace(workspaceAId);

    expect(context.user.id).toBe(userAId);
    expect(context.workspace.id).toBe(workspaceAId);
    expect(context.role).toBe("OWNER");
  });
});
