import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { listNotes, createNote, deleteNote, updateNote } from "@/server/services/notesTasks.service";
import { NoteScopeSchema } from "@/server/db/schema";

const CreateNoteSchema = z.object({
  scope: NoteScopeSchema,
  targetId: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  pinned: z.boolean().default(false),
});

const UpdateNoteSchema = z.object({
  noteId: z.string().min(1, "Note ID is required"),
  content: z.string().min(1).optional(),
  pinned: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const scope = (url.searchParams.get("scope") as "workspace" | "client" | "order") || undefined;
    const targetId = url.searchParams.get("targetId") || undefined;

    const notes = await listNotes(workspace.id, { scope, targetId });
    return NextResponse.json({ notes });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to list notes";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = CreateNoteSchema.parse(body);

    const note = await createNote(workspace.id, parsed);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to create note";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const { noteId, content, pinned } = UpdateNoteSchema.parse(body);

    const note = await updateNote(workspace.id, noteId, { content, pinned });
    return NextResponse.json({ note });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to update note";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const noteId = url.searchParams.get("id");
    if (!noteId) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    await deleteNote(workspace.id, noteId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to delete note";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
