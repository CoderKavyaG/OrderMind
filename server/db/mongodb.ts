import { MongoClient, Db, GridFSBucket, ObjectId } from "mongodb";
import { Readable, Writable } from "stream";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _inMemoryDb: InMemoryDb | undefined;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const GRIDFS_DIR = path.join(DATA_DIR, "gridfs");

function ensureDirs() {
  if (process.env.NODE_ENV === "test") return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(GRIDFS_DIR)) {
    fs.mkdirSync(GRIDFS_DIR, { recursive: true });
  }
}

// Convert serialized document to MongoDB-compatible types
function reviveDocument(doc: any): any {
  if (!doc || typeof doc !== "object") return doc;
  const copy = { ...doc };
  if (copy._id && typeof copy._id === "string" && copy._id.length === 24) {
    try {
      copy._id = new ObjectId(copy._id);
    } catch {
      // keep as string
    }
  }
  for (const [key, val] of Object.entries(copy)) {
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      copy[key] = new Date(val);
    } else if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof ObjectId) && !(val instanceof Date)) {
      copy[key] = reviveDocument(val);
    }
  }
  return copy;
}

// File-backed In-Memory Database for Zero-Setup Offline/Online Operation
class InMemoryCollection {
  private items: any[] = [];

  constructor(public name: string, private dbRef: InMemoryDb) {}

  setItems(items: any[]) {
    this.items = items.map(reviveDocument);
  }

  getItems(): any[] {
    return this.items;
  }

  private matches(item: any, query: any): boolean {
    if (!query || Object.keys(query).length === 0) return true;

    for (const [key, val] of Object.entries(query)) {
      if (key === "$or" && Array.isArray(val)) {
        const anyMatches = val.some((subQuery) => this.matches(item, subQuery));
        if (!anyMatches) return false;
        continue;
      }

      if (key === "$and" && Array.isArray(val)) {
        const allMatch = val.every((subQuery) => this.matches(item, subQuery));
        if (!allMatch) return false;
        continue;
      }

      let itemVal = item[key];
      if (key.includes(".")) {
        itemVal = key.split(".").reduce((acc, part) => acc?.[part], item);
      }

      const itemStr = itemVal instanceof ObjectId ? itemVal.toString() : itemVal != null ? String(itemVal) : undefined;

      // Handle RegExp object directly
      if (val instanceof RegExp) {
        if (itemVal == null || !val.test(String(itemVal))) return false;
        continue;
      }

      // Handle _id or ObjectId comparisons
      if (key === "_id" || itemVal instanceof ObjectId || val instanceof ObjectId) {
        if (val && typeof val === "object") {
          if ("$in" in (val as any)) {
            const inList = (val as any).$in.map((v: any) => (v instanceof ObjectId ? v.toString() : String(v)));
            if (!inList.includes(itemStr)) return false;
            continue;
          }
          if ("$ne" in (val as any)) {
            const neVal = (val as any).$ne;
            const neStr = neVal instanceof ObjectId ? neVal.toString() : String(neVal);
            if (itemStr === neStr) return false;
            continue;
          }
        }
        const targetStr = val instanceof ObjectId ? val.toString() : String(val);
        if (itemStr !== targetStr) return false;
        continue;
      }

      // Handle query operators
      if (val && typeof val === "object") {
        if ("$regex" in (val as any)) {
          const regexStr = (val as any).$regex;
          const options = (val as any).$options || "";
          const regex = new RegExp(regexStr, options);
          if (itemVal == null || !regex.test(String(itemVal))) return false;
          continue;
        }
        if ("$in" in (val as any)) {
          const inList = (val as any).$in;
          if (!inList.some((v: any) => (v instanceof ObjectId ? v.toString() === itemStr : v === itemVal || String(v) === itemStr))) {
            return false;
          }
          continue;
        }
        if ("$ne" in (val as any)) {
          const neVal = (val as any).$ne;
          const neStr = neVal instanceof ObjectId ? neVal.toString() : String(neVal);
          if (itemStr === neStr || itemVal === neVal) return false;
          continue;
        }
      }

      // Handle array items (e.g. tags: "luxury" matches item.tags: ["luxury", "rigid"])
      if (Array.isArray(itemVal)) {
        if (!itemVal.includes(val)) return false;
        continue;
      }

      if (itemVal !== val) return false;
    }
    return true;
  }

  async findOne(query: any): Promise<any | null> {
    this.dbRef.syncFromFile();
    const found = this.items.find((item) => this.matches(item, query));
    return found ? reviveDocument(JSON.parse(JSON.stringify(found))) : null;
  }

  find(query: any = {}) {
    this.dbRef.syncFromFile();
    const matched = this.items.filter((item) => this.matches(item, query));
    let result = [...matched];

    const cursor = {
      sort: (sortObj: Record<string, number>) => {
        const [field, direction] = Object.entries(sortObj)[0] || [];
        if (field) {
          result.sort((a, b) => {
            const valA = a[field] instanceof Date ? a[field].getTime() : a[field];
            const valB = b[field] instanceof Date ? b[field].getTime() : b[field];
            if (valA < valB) return direction === -1 ? 1 : -1;
            if (valA > valB) return direction === -1 ? -1 : 1;
            return 0;
          });
        }
        return cursor;
      },
      limit: (n: number) => {
        result = result.slice(0, n);
        return cursor;
      },
      toArray: async () => result.map((item) => reviveDocument(JSON.parse(JSON.stringify(item)))),
    };

    return cursor;
  }

  async insertOne(doc: any): Promise<{ insertedId: ObjectId }> {
    this.dbRef.syncFromFile();
    const _id = doc._id instanceof ObjectId ? doc._id : doc._id ? new ObjectId(doc._id) : new ObjectId();
    const item = { ...doc, _id };
    this.items.push(item);
    this.dbRef.persistToFile();
    return { insertedId: _id };
  }

  async insertMany(docs: any[]): Promise<{ insertedIds: Record<number, ObjectId> }> {
    this.dbRef.syncFromFile();
    const insertedIds: Record<number, ObjectId> = {};
    docs.forEach((doc, idx) => {
      const _id = doc._id instanceof ObjectId ? doc._id : doc._id ? new ObjectId(doc._id) : new ObjectId();
      const item = { ...doc, _id };
      this.items.push(item);
      insertedIds[idx] = _id;
    });
    this.dbRef.persistToFile();
    return { insertedIds };
  }

  async updateOne(filter: any, update: any, options: { upsert?: boolean } = {}): Promise<any> {
    this.dbRef.syncFromFile();
    const idx = this.items.findIndex((item) => this.matches(item, filter));
    if (idx !== -1) {
      if (update.$set) {
        this.items[idx] = { ...this.items[idx], ...update.$set };
      }
      this.dbRef.persistToFile();
      return { matchedCount: 1, modifiedCount: 1 };
    }
    if (options.upsert) {
      const newDoc = {
        ...(update.$set || {}),
        ...filter,
        _id: new ObjectId(),
      };
      this.items.push(newDoc);
      this.dbRef.persistToFile();
      return { matchedCount: 0, upsertedCount: 1, upsertedId: newDoc._id };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async countDocuments(filter: any = {}): Promise<number> {
    this.dbRef.syncFromFile();
    return this.items.filter((item) => this.matches(item, filter)).length;
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    this.dbRef.syncFromFile();
    const idx = this.items.findIndex((item) => this.matches(item, filter));
    if (idx !== -1) {
      this.items.splice(idx, 1);
      this.dbRef.persistToFile();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: any): Promise<{ deletedCount: number }> {
    this.dbRef.syncFromFile();
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => !this.matches(item, filter));
    const deletedCount = initialLen - this.items.length;
    if (deletedCount > 0) {
      this.dbRef.persistToFile();
    }
    return { deletedCount };
  }
}

class InMemoryDb {
  private collections = new Map<string, InMemoryCollection>();
  private lastMtime = 0;

  constructor() {
    this.syncFromFile();
  }

  syncFromFile() {
    if (process.env.NODE_ENV === "test") return;
    try {
      ensureDirs();
      if (!fs.existsSync(DB_FILE)) return;
      const stat = fs.statSync(DB_FILE);
      if (stat.mtimeMs <= this.lastMtime) return;

      const raw = fs.readFileSync(DB_FILE, "utf-8");
      if (!raw.trim()) return;
      const data = JSON.parse(raw);
      for (const [colName, items] of Object.entries(data)) {
        const col = this.collection(colName);
        col.setItems(items as any[]);
      }
      this.lastMtime = stat.mtimeMs;
    } catch {
      // Ignore read errors
    }
  }

  persistToFile() {
    if (process.env.NODE_ENV === "test") return;
    try {
      ensureDirs();
      const data: Record<string, any[]> = {};
      for (const [colName, col] of this.collections.entries()) {
        data[colName] = col.getItems().map((item) => {
          const serializable = { ...item };
          if (serializable._id instanceof ObjectId) {
            serializable._id = serializable._id.toString();
          }
          return serializable;
        });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
    } catch (err) {
      console.warn("[OrderMind DB] Warning: could not persist to db.json", err);
    }
  }

  collection(name: string): any {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection(name, this));
    }
    return this.collections.get(name)!;
  }

  listCollections() {
    const list = Array.from(this.collections.keys()).map((name) => ({ name }));
    return {
      toArray: async () => list,
    };
  }
}

function getInMemoryStore(): InMemoryDb {
  if (!global._inMemoryDb) {
    global._inMemoryDb = new InMemoryDb();
  }
  return global._inMemoryDb;
}

const uri = process.env.MONGODB_URI || "";
const isAtlas = uri.startsWith("mongodb+srv://") || uri.includes(".mongodb.net");
const options = { serverSelectionTimeoutMS: isAtlas ? 5000 : 1200 };

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient | null>;
let useInMemory = !uri || uri.startsWith("memory://");

if (!useInMemory) {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect().catch((err) => {
        console.log("[OrderMind DB] MongoDB connection skipped/unreachable. Seamlessly active on persistent file storage (.data/db.json).");
        useInMemory = true;
        return null as any;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect().catch((err) => {
      console.log("[OrderMind DB] MongoDB connection skipped/unreachable. Seamlessly active on persistent file storage (.data/db.json).");
      useInMemory = true;
      return null as any;
    });
  }
} else {
  clientPromise = Promise.resolve(null);
}

export async function getDb(): Promise<Db> {
  if (useInMemory) {
    return getInMemoryStore() as unknown as Db;
  }
  try {
    const connectedClient = await clientPromise;
    if (!connectedClient) {
      useInMemory = true;
      return getInMemoryStore() as unknown as Db;
    }
    return connectedClient.db();
  } catch {
    useInMemory = true;
    return getInMemoryStore() as unknown as Db;
  }
}

export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (useInMemory) {
    ensureDirs();
    return {
      openUploadStream: (filename: string, opts?: any) => {
        const id = new ObjectId();
        const chunks: Buffer[] = [];
        const writable = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(Buffer.from(chunk));
            callback();
          },
          final(callback) {
            try {
              const buffer = Buffer.concat(chunks);
              const filePath = path.join(GRIDFS_DIR, `${id.toString()}.bin`);
              const metaPath = path.join(GRIDFS_DIR, `${id.toString()}.meta.json`);
              fs.writeFileSync(filePath, buffer);
              fs.writeFileSync(
                metaPath,
                JSON.stringify({
                  id: id.toString(),
                  filename,
                  contentType: opts?.metadata?.contentType || "application/octet-stream",
                  createdAt: new Date().toISOString(),
                })
              );
              callback();
            } catch (err: any) {
              callback(err);
            }
          },
        }) as any;
        writable.id = id;
        return writable;
      },
      openDownloadStream: (id: ObjectId) => {
        const filePath = path.join(GRIDFS_DIR, `${id.toString()}.bin`);
        if (!fs.existsSync(filePath)) {
          throw new Error("GridFS file not found in file store");
        }
        return fs.createReadStream(filePath);
      },
    } as unknown as GridFSBucket;
  }

  try {
    const db = await getDb();
    if (useInMemory) {
      return getGridFSBucket();
    }
    return new GridFSBucket(db, { bucketName: "attachments" });
  } catch {
    useInMemory = true;
    return getGridFSBucket();
  }
}

export default clientPromise;
