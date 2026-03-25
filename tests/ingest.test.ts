import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSql, mockRelease } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockRelease: vi.fn(),
}));

vi.mock("@vercel/postgres", () => ({
  db: {
    connect: () =>
      Promise.resolve({
        sql: mockSql,
        release: mockRelease,
      }),
  },
  sql: mockSql,
}));

vi.mock("@/lib/logger", () => ({
  log: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/handlers/github", () => ({
  handleGitHub: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/handlers/sheets", () => ({
  handleSheets: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/handlers/uncategorized", () => ({
  handleUncategorized: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/router", () => ({
  route: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/ingest/route";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ingest", () => {
  beforeEach(() => {
    mockSql.mockReset();
    mockRelease.mockReset();
  });

  it("inserts a thingy and log entry for a valid submission", async () => {
    // First call: idempotency check (no existing row)
    mockSql.mockResolvedValueOnce({ rows: [] });
    // BEGIN
    mockSql.mockResolvedValueOnce(undefined);
    // INSERT thingies
    mockSql.mockResolvedValueOnce({ rows: [{ id: 42 }] });
    // INSERT execution_logs
    mockSql.mockResolvedValueOnce(undefined);
    // COMMIT
    mockSql.mockResolvedValueOnce(undefined);

    const request = makeRequest({
      text: "Buy milk #task",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.thingyId).toBe(42);
    expect(json.token).toBe("task");
    expect(json.deduplicated).toBeUndefined();

    // Verify sql was called at least 5 times (check, begin, insert thingy, insert log, commit)
    expect(mockSql.mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it("returns deduplicated response for a duplicate clientId", async () => {
    // Idempotency check returns existing row
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 42, token: "task" }],
    });

    const request = makeRequest({
      text: "Buy milk #task",
      clientId: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.thingyId).toBe(42);
    expect(json.deduplicated).toBe(true);

    // Only 1 sql call (the idempotency check) -- no insert happened
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it("applies UI GitHub routing and stores feature token", async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });
    mockSql.mockResolvedValueOnce(undefined);
    mockSql.mockResolvedValueOnce({ rows: [{ id: 99 }] });
    mockSql.mockResolvedValueOnce(undefined);
    mockSql.mockResolvedValueOnce(undefined);

    const request = makeRequest({
      text: "My note",
      clientId: "550e8400-e29b-41d4-a716-446655440001",
      routing: { mode: "github", secondary: "thingy" },
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.thingyId).toBe(99);
    expect(json.token).toBe("feature");
  });
});
