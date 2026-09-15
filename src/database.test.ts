import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import initSqlJs from "sql.js";
import { describe, expect, it, vi } from "vitest";
import { defaultPlan, type Review } from "./model";

vi.mock("sql.js/dist/sql-wasm.wasm?url", () => ({
  default: resolve("node_modules/sql.js/dist/sql-wasm.wasm"),
}));

import {
  createDatabase,
  importBackup,
  loadData,
  readDatabase,
  savePlan,
  saveReview,
} from "./database";

const SQL = await initSqlJs({
  locateFile: () => resolve("node_modules/sql.js/dist/sql-wasm.wasm"),
});
const review: Review = {
  id: "record-1",
  date: "2027-06-01",
  mode: "actual",
  cash: 1200,
  taxable: 3000,
  retirement: 4000,
  india: 100000,
  debt: 50,
  fx: 85,
  contribution: 300,
  followed: true,
  mood: "Calm",
  note: "Private household note",
};

function storedBytes(): Promise<Uint8Array> {
  return new Promise((resolveBytes, reject) => {
    const open = indexedDB.open("northstar-private", 1);
    open.onsuccess = () => {
      const request = open.result
        .transaction("files")
        .objectStore("files")
        .get("portfolio");
      request.onsuccess = () => {
        open.result.close();
        resolveBytes(request.result);
      };
      request.onerror = () => reject(request.error);
    };
    open.onerror = () => reject(open.error);
  });
}

describe("SQLite backup validation", () => {
  it("round trips a plan and private review through exported database bytes", () => {
    const original = createDatabase(SQL, { ...defaultPlan, monthly: 2500 }, [
      review,
    ]);
    const reopened = new SQL.Database(original.export());
    expect(readDatabase(reopened)).toEqual({
      plan: { ...defaultPlan, monthly: 2500 },
      reviews: [review],
    });
    reopened.close();
    original.close();
  });

  it("rejects a SQLite file with the wrong application ID or version", () => {
    const wrongId = createDatabase(SQL);
    wrongId.run("PRAGMA application_id = 42");
    expect(() => readDatabase(wrongId)).toThrow("supported version");
    wrongId.close();

    const wrongVersion = createDatabase(SQL);
    wrongVersion.run("PRAGMA user_version = 2");
    expect(() => readDatabase(wrongVersion)).toThrow("supported version");
    wrongVersion.close();
  });

  it("rejects malformed plan and review values", () => {
    const badPlan = createDatabase(SQL);
    badPlan.run("UPDATE settings SET value=? WHERE id=1", [
      JSON.stringify({ ...defaultPlan, reserve: 200000 }),
    ]);
    expect(() => readDatabase(badPlan)).toThrow(
      "invalid plan or review values",
    );
    badPlan.close();

    const badReview = createDatabase(SQL, defaultPlan, [review]);
    badReview.run("UPDATE reviews SET value=? WHERE id=?", [
      JSON.stringify({ ...review, date: "2027-02-30" }),
      review.id,
    ]);
    expect(() => readDatabase(badReview)).toThrow(
      "invalid plan or review values",
    );
    badReview.close();
  });

  it("rejects non-JSON backup values without importing them", () => {
    const db = createDatabase(SQL);
    db.run("UPDATE settings SET value=? WHERE id=1", ["not json"]);
    expect(() => readDatabase(db)).toThrow();
    db.close();
  });
});

describe("private device persistence", () => {
  it("loads, saves, and imports a backup while rebuilding imported tables", async () => {
    expect((await loadData()).plan).toEqual(defaultPlan);
    const changed = { ...defaultPlan, monthly: 4200 };
    await savePlan(changed);
    expect(await saveReview(review)).toEqual([review]);

    const saved = new SQL.Database(await storedBytes());
    expect(readDatabase(saved)).toEqual({ plan: changed, reviews: [review] });
    saved.close();

    const source = createDatabase(SQL, { ...changed, monthly: 1500 }, [review]);
    source.run(
      "CREATE TABLE extra_private (secret TEXT); INSERT INTO extra_private VALUES ('discard me')",
    );
    const file = new File([new Uint8Array(source.export())], "backup.sqlite", {
      type: "application/vnd.sqlite3",
    });
    source.close();
    expect((await importBackup(file)).plan.monthly).toBe(1500);

    const imported = new SQL.Database(await storedBytes());
    expect(readDatabase(imported).reviews).toEqual([review]);
    expect(
      imported.exec(
        "SELECT name FROM sqlite_master WHERE name='extra_private'",
      ),
    ).toEqual([]);
    imported.close();
  });

  it("does not carry a failed plan write into a later successful review save", async () => {
    await loadData();
    const before = new SQL.Database(await storedBytes());
    const originalPlan = readDatabase(before).plan;
    before.close();

    const realTransaction = IDBDatabase.prototype.transaction;
    let failNextWrite = true;
    const transactionSpy = vi
      .spyOn(IDBDatabase.prototype, "transaction")
      .mockImplementation(function (
        this: IDBDatabase,
        ...args: Parameters<IDBDatabase["transaction"]>
      ) {
        if (args[1] === "readwrite" && failNextWrite) {
          failNextWrite = false;
          throw new DOMException(
            "Simulated device write failure",
            "QuotaExceededError",
          );
        }
        return Reflect.apply(realTransaction, this, args) as IDBTransaction;
      });

    try {
      await expect(
        savePlan({ ...originalPlan, monthly: 7777 }),
      ).rejects.toThrow("Simulated device write failure");
      expect(failNextWrite).toBe(false);
    } finally {
      transactionSpy.mockRestore();
    }

    const laterReview = { ...review, id: "record-2", date: "2027-07-01" };
    await saveReview(laterReview);
    const persisted = new SQL.Database(await storedBytes());
    expect(readDatabase(persisted).plan).toEqual(originalPlan);
    expect(readDatabase(persisted).reviews).toContainEqual(laterReview);
    persisted.close();
  });
});

describe("public market snapshot", () => {
  it("contains market data but no household plan or private review records", () => {
    const market = JSON.parse(
      readFileSync(resolve("public/market.json"), "utf8"),
    );
    expect(Object.keys(market).sort()).toEqual([
      "assets",
      "errors",
      "fetchedAt",
    ]);
    expect(market.assets.length).toBeGreaterThan(0);
    expect(market).not.toHaveProperty("plan");
    expect(market).not.toHaveProperty("reviews");
    expect(JSON.stringify(market)).not.toContain(review.note);
  });
});
