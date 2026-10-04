import { getDb } from "@/server/db/mongodb";
import {
  Note,
  NoteSchema,
  NoteScope,
  TaskScheduleEvent,
  TaskScheduleEventSchema,
  TaskType,
} from "@/server/db/schema";
import { ObjectId } from "mongodb";

// --- NOTES ---

export async function listNotes(
  workspaceId: string,
  filter?: { scope?: NoteScope; targetId?: string }
): Promise<Array<Note & { id: string }>> {
  const db = await getDb();
  const query: Record<string, any> = { workspaceId };
  if (filter?.scope) query.scope = filter.scope;
  if (filter?.targetId) query.targetId = filter.targetId;

  const notes = await db
    .collection<Note>("notes")
    .find(query)
    .sort({ pinned: -1, createdAt: -1 })
    .toArray();

  return notes.map((n) => ({
    ...n,
    id: n._id ? n._id.toString() : "",
  }));
}

export async function createNote(
  workspaceId: string,
  input: {
    scope: NoteScope;
    targetId?: string;
    content: string;
    pinned?: boolean;
  }
): Promise<Note & { id: string }> {
  const db = await getDb();
  const newNoteDoc: Omit<Note, "_id" | "id"> = {
    workspaceId,
    scope: input.scope,
    targetId: input.targetId,
    content: input.content.trim(),
    pinned: input.pinned ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const parsed = NoteSchema.parse(newNoteDoc);
  const result = await db.collection("notes").insertOne(parsed);

  return {
    ...parsed,
    _id: result.insertedId,
    id: result.insertedId.toString(),
  };
}

export async function deleteNote(workspaceId: string, noteId: string): Promise<boolean> {
  const db = await getDb();
  let queryId: any = noteId;
  try {
    queryId = new ObjectId(noteId);
  } catch {
    // keep string
  }

  const result = await db.collection("notes").deleteOne({ _id: queryId, workspaceId });
  return (result.deletedCount ?? 0) > 0;
}

export async function updateNote(
  workspaceId: string,
  noteId: string,
  input: Partial<{ content: string; pinned: boolean }>
): Promise<(Note & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = noteId;
  try {
    queryId = new ObjectId(noteId);
  } catch {
    // keep string
  }

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (input.content !== undefined) updateFields.content = input.content.trim();
  if (input.pinned !== undefined) updateFields.pinned = input.pinned;

  await db.collection("notes").updateOne(
    { _id: queryId, workspaceId },
    { $set: updateFields }
  );

  const updated = await db.collection<Note>("notes").findOne({ _id: queryId, workspaceId });
  if (!updated) return null;
  return {
    ...updated,
    id: updated._id ? updated._id.toString() : noteId,
  };
}


// --- TASKS / SCHEDULE EVENTS ---

export async function listTasks(
  workspaceId: string,
  filter?: { orderId?: string; clientId?: string; type?: TaskType; done?: boolean }
): Promise<Array<TaskScheduleEvent & { id: string }>> {
  const db = await getDb();
  const query: Record<string, any> = { workspaceId };
  if (filter?.orderId) query.orderId = filter.orderId;
  if (filter?.clientId) query.clientId = filter.clientId;
  if (filter?.type) query.type = filter.type;
  if (filter?.done !== undefined) query.done = filter.done;

  const tasks = await db
    .collection<TaskScheduleEvent>("tasks")
    .find(query)
    .sort({ dueAt: 1 })
    .toArray();

  return tasks.map((t) => ({
    ...t,
    id: t._id ? t._id.toString() : "",
  }));
}

export async function createTask(
  workspaceId: string,
  input: {
    type: TaskType;
    title: string;
    dueAt: Date | string;
    orderId?: string;
    clientId?: string;
  }
): Promise<TaskScheduleEvent & { id: string }> {
  const db = await getDb();
  const parsedDueAt = input.dueAt instanceof Date ? input.dueAt : new Date(input.dueAt);

  const newTaskDoc: Omit<TaskScheduleEvent, "_id" | "id"> = {
    workspaceId,
    type: input.type,
    title: input.title.trim(),
    dueAt: parsedDueAt,
    orderId: input.orderId,
    clientId: input.clientId,
    done: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const parsed = TaskScheduleEventSchema.parse(newTaskDoc);
  const result = await db.collection("tasks").insertOne(parsed);

  return {
    ...parsed,
    _id: result.insertedId,
    id: result.insertedId.toString(),
  };
}

export async function updateTask(
  workspaceId: string,
  taskId: string,
  input: Partial<{
    title: string;
    dueAt: Date | string;
    done: boolean;
  }>
): Promise<(TaskScheduleEvent & { id: string }) | null> {
  const db = await getDb();
  let queryId: any = taskId;
  try {
    queryId = new ObjectId(taskId);
  } catch {
    // keep string
  }

  const updateFields: Record<string, any> = { updatedAt: new Date() };
  if (input.title !== undefined) updateFields.title = input.title.trim();
  if (input.done !== undefined) updateFields.done = input.done;
  if (input.dueAt !== undefined) {
    updateFields.dueAt = input.dueAt instanceof Date ? input.dueAt : new Date(input.dueAt);
  }

  await db.collection("tasks").updateOne(
    { _id: queryId, workspaceId },
    { $set: updateFields }
  );

  const updated = await db.collection<TaskScheduleEvent>("tasks").findOne({ _id: queryId, workspaceId });
  if (!updated) return null;
  return {
    ...updated,
    id: updated._id ? updated._id.toString() : taskId,
  };
}

export async function updateTaskStatus(
  workspaceId: string,
  taskId: string,
  done: boolean
): Promise<TaskScheduleEvent & { id: string }> {
  const res = await updateTask(workspaceId, taskId, { done });
  if (!res) throw new Error("Task not found or access denied");
  return res;
}

export async function deleteTask(workspaceId: string, taskId: string): Promise<boolean> {
  const db = await getDb();
  let queryId: any = taskId;
  try {
    queryId = new ObjectId(taskId);
  } catch {
    // keep string
  }

  const result = await db.collection("tasks").deleteOne({ _id: queryId, workspaceId });
  return (result.deletedCount ?? 0) > 0;
}


