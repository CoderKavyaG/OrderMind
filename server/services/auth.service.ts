import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/server/db/mongodb";
import { hashPassword, verifyPassword } from "@/server/auth/passwords";
import { signToken, type TokenPayload } from "@/server/auth/jwt";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/server/auth/rate-limit";
import type { User, Workspace, Member } from "@/server/db/schema";

export const SignupInputSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
});

export const LoginInputSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const OnboardingInputSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  industry: z.string().default("Packaging"),
});

export async function signupUser(input: z.infer<typeof SignupInputSchema>) {
  const data = SignupInputSchema.parse(input);
  const db = await getDb();

  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = await db.collection<User>("users").findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hashPassword(data.password);
  const newUserDoc = {
    email: normalizedEmail,
    passwordHash,
    name: data.name.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const insertResult = await db.collection("users").insertOne(newUserDoc);
  const userId = insertResult.insertedId.toString();

  const token = await signToken({
    userId,
    email: normalizedEmail,
  });

  return {
    token,
    user: {
      id: userId,
      email: normalizedEmail,
      name: data.name.trim(),
      needsOnboarding: true,
    },
  };
}

export async function loginUser(input: z.infer<typeof LoginInputSchema>, clientIp = "127.0.0.1") {
  const data = LoginInputSchema.parse(input);
  const normalizedEmail = data.email.toLowerCase().trim();

  // In-memory rate limiting
  const rateLimitKey = `${clientIp}:${normalizedEmail}`;
  const rateLimit = checkLoginRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    throw new Error("Too many failed login attempts. Please wait 60 seconds before trying again.");
  }

  const db = await getDb();
  const user = await db.collection<User>("users").findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Clear rate limit on successful authentication
  resetLoginRateLimit(rateLimitKey);

  const userId = user._id!.toString();

  // Find user's active membership
  const member = await db.collection<Member>("members").findOne({ userId });
  const workspaceId = member ? member.workspaceId : user.activeWorkspaceId;

  const token = await signToken({
    userId,
    email: normalizedEmail,
    workspaceId,
  });

  return {
    token,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      activeWorkspaceId: workspaceId,
      needsOnboarding: !workspaceId,
    },
  };
}

export async function completeOnboarding(
  userId: string,
  input: z.infer<typeof OnboardingInputSchema>
) {
  const data = OnboardingInputSchema.parse(input);
  const db = await getDb();

  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw new Error("User account not found");
  }

  // Create Workspace
  const newWorkspace = {
    name: data.businessName.trim(),
    industry: data.industry.trim() || "Packaging",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const wsResult = await db.collection("workspaces").insertOne(newWorkspace);
  const workspaceId = wsResult.insertedId.toString();

  // Create OWNER membership
  const ownerMember = {
    workspaceId,
    userId,
    role: "OWNER" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection("members").insertOne(ownerMember);

  // Update user's active workspace
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { activeWorkspaceId: workspaceId, updatedAt: new Date() } }
  );

  // Issue new token with active workspaceId
  const token = await signToken({
    userId,
    email: user.email,
    workspaceId,
  });

  return {
    token,
    workspace: {
      id: workspaceId,
      name: newWorkspace.name,
      industry: newWorkspace.industry,
    },
  };
}

export async function getCurrentUserData(userId: string) {
  const db = await getDb();
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return null;

  // Find all memberships
  const memberships = await db.collection<Member>("members").find({ userId }).toArray();
  const workspaceIds = memberships.map((m) => new ObjectId(m.workspaceId));

  const workspaces = await db
    .collection<Workspace>("workspaces")
    .find({ _id: { $in: workspaceIds } })
    .toArray();

  const activeWsId = user.activeWorkspaceId || (workspaces[0]?._id ? workspaces[0]._id.toString() : undefined);
  const activeWorkspace = workspaces.find((w) => w._id!.toString() === activeWsId);
  const activeMember = memberships.find((m) => m.workspaceId === activeWsId);

  return {
    user: {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
    },
    workspaces: workspaces.map((w) => ({
      id: w._id!.toString(),
      name: w.name,
      industry: w.industry,
    })),
    activeWorkspace: activeWorkspace
      ? {
          id: activeWorkspace._id!.toString(),
          name: activeWorkspace.name,
          industry: activeWorkspace.industry,
          role: activeMember?.role || "OPERATOR",
        }
      : null,
  };
}
