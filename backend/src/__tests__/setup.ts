import { beforeAll, afterAll } from "vitest";
import { initDb, closeDb } from "../database";

// Use DATABASE_URL env var for tests, or skip DB-dependent tests
const dbUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;

beforeAll(async () => {
  if (dbUrl) {
    await initDb(dbUrl);
  }
});

afterAll(() => {
  closeDb();
});
