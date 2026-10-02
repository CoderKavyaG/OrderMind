import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import { verifyToken, AUTH_COOKIE_NAME } from "@/server/auth/jwt";
import type { User, Workspace, UserRole } from "@/server/db/schema";

export interface AuthenticatedContext {
  user: User & { id: string };
  workspace: Workspace & { id: string };
  role: UserRole;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Returns authenticated user context, active workspace, and verified member role.
 * Throws typed AuthError (401 / 403 / 404) if unauthenticated or tenant mismatch.
 */
export async function requireWorkspace(reqWorkspaceId?: string): Promise<AuthenticatedContext> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw new AuthError("Authentication required", 401);
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.userId) {
    throw new AuthError("Invalid or expired session token", 401);
  }

  const db = await getDb();
  let userObjectId: ObjectId;
  try {
    userObjectId = new ObjectId(payload.userId);
  } catch {
    throw new AuthError("Invalid user identification", 401);
  }

  const userDoc = await db.collection<User>("users").findOne({ _id: userObjectId });
  if (!userDoc) {
    throw new AuthError("User account not found", 401);
  }

  const userWithId = {
    ...userDoc,
    id: userDoc._id!.toString(),
  };

  // Determine targeted workspace
  const targetWorkspaceId = reqWorkspaceId || payload.workspaceId || userDoc.activeWorkspaceId;

  let memberDoc;
  if (targetWorkspaceId) {
    memberDoc = await db.collection("members").findOne({
      userId: userWithId.id,
      workspaceId: targetWorkspaceId,
    });
  }

  // If no specific workspace or not member, check if user has any active workspace membership
  if (!memberDoc) {
    memberDoc = await db.collection("members").findOne({
      userId: userWithId.id,
    });
  }

  if (!memberDoc) {
    throw new AuthError("No workspace membership found. Please complete onboarding.", 403);
  }

  let workspaceObjectId: ObjectId;
  try {
    workspaceObjectId = new ObjectId(memberDoc.workspaceId);
  } catch {
    throw new AuthError("Invalid workspace identification", 400);
  }

  const workspaceDoc = await db.collection<Workspace>("workspaces").findOne({ _id: workspaceObjectId });
  if (!workspaceDoc) {
    throw new AuthError("Workspace does not exist", 404);
  }

  const workspaceWithId = {
    ...workspaceDoc,
    id: workspaceDoc._id!.toString(),
  };

  return {
    user: userWithId,
    workspace: workspaceWithId,
    role: memberDoc.role as UserRole,
  };
}

export async function getOptionalUser(): Promise<{ user: User & { id: string } } | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.userId) return null;

    const db = await getDb();
    const userDoc = await db.collection<User>("users").findOne({ _id: new ObjectId(payload.userId) });
    if (!userDoc) return null;

    return {
      user: {
        ...userDoc,
        id: userDoc._id!.toString(),
      },
    };
  } catch {
    return null;
  }
}
