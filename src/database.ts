import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import {
  defaultPlan,
  validPlan,
  validReview,
  type Plan,
  type Review,
} from "./model";

const engine = initSqlJs({ locateFile: () => wasmUrl });
const APP_ID = 1314083922;
let database: Database;
let storage: IDBDatabase;
let writeQueue = Promise.resolve();

export function createDatabase(
  SQL: Awaited<typeof engine>,
  plan = defaultPlan,
  reviews: Review[] = [],
) {
  const db = new SQL.Database();
  db.run(`PRAGMA application_id = ${APP_ID}; PRAGMA user_version = 1;
    CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
    CREATE TABLE reviews (id TEXT PRIMARY KEY, date TEXT NOT NULL, mode TEXT NOT NULL, value TEXT NOT NULL, UNIQUE(date,mode));`);
  db.run("INSERT INTO settings VALUES (1, ?)", [JSON.stringify(plan)]);
  for (const review of reviews)
    db.run("INSERT INTO reviews VALUES (?, ?, ?, ?)", [
      review.id,
      review.date,
      review.mode,
      JSON.stringify(review),
    ]);
  return db;
}

export function readDatabase(db: Database): { plan: Plan; reviews: Review[] } {
  if (
    db.exec("PRAGMA application_id")[0]?.values[0]?.[0] !== APP_ID ||
    db.exec("PRAGMA user_version")[0]?.values[0]?.[0] !== 1
  )
    throw new Error("Choose a Northstar backup with a supported version.");
  let plan, reviews;
  try {
    plan = JSON.parse(
      String(
        db.exec("SELECT value FROM settings WHERE id=1")[0]?.values[0]?.[0],
      ),
    );
    const rows =
      db.exec("SELECT value FROM reviews ORDER BY date DESC")[0]?.values ?? [];
    reviews = rows.map((row) => JSON.parse(String(row[0])));
  } catch {
    throw new Error(
      "This backup contains unreadable records. Nothing was imported.",
    );
  }
  if (!validPlan(plan) || reviews.length > 10000 || !reviews.every(validReview))
    throw new Error(
      "This backup contains invalid plan or review values. Nothing was imported.",
    );
  return { plan, reviews };
}

function persist(bytes: Uint8Array): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const tx = storage.transaction("files", "readwrite");
    tx.objectStore("files").put(bytes, "portfolio");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(
        new Error(
          "Could not save on this device. Export a backup before closing.",
        ),
      );
    tx.onabort = () =>
      reject(
        new Error(
          "Device storage was interrupted. Export a backup before closing.",
        ),
      );
  });
}

function commit(change: (next: Database) => void) {
  const operation = writeQueue
    .catch(() => {})
    .then(async () => {
      const SQL = await engine;
      const next = new SQL.Database(database.export());
      try {
        change(next);
        const data = readDatabase(next);
        await persist(next.export());
        database.close();
        database = next;
        return data;
      } catch (error) {
        next.close();
        throw error;
      }
    });
  writeQueue = operation.then(
    () => {},
    () => {},
  );
  return operation;
}

let initialized: ReturnType<typeof initialize> | undefined;
async function initialize() {
  const SQL = await engine;
  storage = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("northstar-private", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Device storage is unavailable. Enable browser storage and reload.",
        ),
      );
  });
  const bytes = await new Promise<Uint8Array | undefined>((resolve, reject) => {
    const request = storage
      .transaction("files")
      .objectStore("files")
      .get("portfolio");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Your saved database could not be read."));
  });
  database = bytes ? new SQL.Database(bytes) : createDatabase(SQL);
  const data = readDatabase(database);
  if (!bytes) await persist(database.export());
  return data;
}

export const loadData = () => (initialized ??= initialize());
export async function savePlan(plan: Plan) {
  if (!validPlan(plan))
    throw new Error(
      "Check your plan values. Protected cash cannot exceed starting savings.",
    );
  await commit((next) =>
    next.run("UPDATE settings SET value=? WHERE id=1", [JSON.stringify(plan)]),
  );
}
export async function saveReview(review: Review) {
  if (!validReview(review))
    throw new Error("Check the review date and amounts.");
  const data = await commit((next) =>
    next.run("INSERT OR REPLACE INTO reviews VALUES (?, ?, ?, ?)", [
      review.id,
      review.date,
      review.mode,
      JSON.stringify(review),
    ]),
  );
  return data.reviews;
}
export async function removeReview(id: string) {
  const data = await commit((next) =>
    next.run("DELETE FROM reviews WHERE id=?", [id]),
  );
  return data.reviews;
}
export async function importBackup(file: File) {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("This backup is too large (maximum 5 MB).");
  const SQL = await engine;
  const incoming = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
  let data;
  try {
    data = readDatabase(incoming);
  } finally {
    incoming.close();
  }
  // Rebuild trusted tables; never persist an imported schema or its triggers.
  return commit((next) => {
    next.run("UPDATE settings SET value=? WHERE id=1", [
      JSON.stringify(data.plan),
    ]);
    next.run("DELETE FROM reviews");
    for (const review of data.reviews)
      next.run("INSERT INTO reviews VALUES (?, ?, ?, ?)", [
        review.id,
        review.date,
        review.mode,
        JSON.stringify(review),
      ]);
  });
}
export function exportBackup() {
  const bytes = database.export();
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: "application/vnd.sqlite3" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `northstar-${new Date().toISOString().slice(0, 10)}.sqlite`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
