import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb } from "@/server/db/mongodb";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";

const AddMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["OWNER", "ADMIN", "OPERATOR"]).default("OPERATOR"),
});

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const db = await getDb();

    const members = await db
      .collection("members")
      .find({ workspaceId: workspace.id })
      .toArray();

    // Enrich with user info
    const enriched = await Promise.all(
      members.map(async (m) => {
        let user: any = null;
        if (m.userId) {
          try {
            user = await db.collection("users").findOne({
              $or: [{ _id: new ObjectId(m.userId) }, { id: m.userId }],
            });
          } catch {
            user = await db.collection("users").findOne({ id: m.userId });
          }
        }
        return {
          id: m._id ? m._id.toString() : m.id,
          userId: m.userId,
          email: user?.email || m.email || "invited@domain.com",
          name: user?.name || m.name || (user?.email ? user.email.split("@")[0] : "Team Member"),
          role: m.role || "OPERATOR",
          createdAt: m.createdAt || new Date(),
        };
      })
    );

    return NextResponse.json({ success: true, members: enriched });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to load team members";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = AddMemberSchema.parse(body);
    const db = await getDb();

    // Check if user with this email already exists
    let user = await db.collection("users").findOne({ email: parsed.email.toLowerCase() });
    let userId: string;

    if (user) {
      userId = user._id ? user._id.toString() : user.id;
    } else {
      // Create provisional user placeholder
      const inserted = await db.collection("users").insertOne({
        email: parsed.email.toLowerCase(),
        name: parsed.name || parsed.email.split("@")[0],
        passwordHash: "",
        activeWorkspaceId: workspace.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userId = inserted.insertedId.toString();
    }

    // Check if membership already exists
    const existing = await db.collection("members").findOne({
      workspaceId: workspace.id,
      $or: [{ userId }, { email: parsed.email.toLowerCase() }],
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already a member of this workspace" },
        { status: 400 }
      );
    }

    const newMember = {
      workspaceId: workspace.id,
      userId,
      email: parsed.email.toLowerCase(),
      name: parsed.name || parsed.email.split("@")[0],
      role: parsed.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("members").insertOne(newMember);

    return NextResponse.json(
      {
        success: true,
        member: {
          id: result.insertedId.toString(),
          userId,
          email: parsed.email.toLowerCase(),
          name: parsed.name || parsed.email.split("@")[0],
          role: parsed.role,
          createdAt: newMember.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to invite member";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const db = await getDb();
    let query: any;
    try {
      query = { _id: new ObjectId(memberId), workspaceId: workspace.id };
    } catch {
      query = { id: memberId, workspaceId: workspace.id };
    }

    await db.collection("members").deleteOne(query);
    return NextResponse.json({ success: true, deleted: true });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to remove member";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
