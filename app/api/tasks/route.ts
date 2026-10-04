import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, AuthError } from "@/server/auth/workspace";
import { listTasks, createTask, updateTask, deleteTask } from "@/server/services/notesTasks.service";
import { TaskTypeSchema } from "@/server/db/schema";

const CreateTaskSchema = z.object({
  type: TaskTypeSchema,
  title: z.string().min(1, "Title is required"),
  dueAt: z.string().or(z.date()),
  orderId: z.string().optional(),
  clientId: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
  title: z.string().min(1).optional(),
  dueAt: z.string().or(z.date()).optional(),
  done: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId") || undefined;
    const clientId = url.searchParams.get("clientId") || undefined;
    const doneParam = url.searchParams.get("done");
    const done = doneParam === null ? undefined : doneParam === "true";

    const tasks = await listTasks(workspace.id, { orderId, clientId, done });
    return NextResponse.json({ tasks });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to list tasks";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const parsed = CreateTaskSchema.parse(body);

    const task = await createTask(workspace.id, {
      ...parsed,
      dueAt: new Date(parsed.dueAt),
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await request.json();
    const { taskId, title, dueAt, done } = UpdateTaskSchema.parse(body);

    const task = await updateTask(workspace.id, taskId, {
      title,
      dueAt,
      done,
    });
    return NextResponse.json({ task });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to update task";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspace } = await requireWorkspace();
    const url = new URL(request.url);
    const taskId = url.searchParams.get("id");
    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    await deleteTask(workspace.id, taskId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const msg = error instanceof Error ? error.message : "Failed to delete task";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
