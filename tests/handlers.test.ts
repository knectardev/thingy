import { describe, it, expect, vi, beforeEach } from "vitest";
import { log } from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  log: vi.fn().mockResolvedValue(undefined),
}));

import { handleGitHub } from "@/lib/handlers/github";
import { handleSheets } from "@/lib/handlers/sheets";
import { handleUncategorized } from "@/lib/handlers/uncategorized";

const mockedLog = vi.mocked(log);

describe("handlers", () => {
  beforeEach(() => {
    mockedLog.mockClear();
  });

  it("github handler calls logger.log at start and end", async () => {
    await handleGitHub("Buy milk", 1);

    const calls = mockedLog.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0][2]).toBe("started");
    expect(calls[calls.length - 1][2]).toBe("completed");
  });

  it("sheets handler calls logger.log at start and end", async () => {
    await handleSheets("New idea", 2);

    const calls = mockedLog.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0][2]).toBe("started");
    expect(calls[calls.length - 1][2]).toBe("completed");
  });

  it("uncategorized handler calls logger.log at start and end", async () => {
    await handleUncategorized("Random thought", 3);

    const calls = mockedLog.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0][2]).toBe("started");
    expect(calls[calls.length - 1][2]).toBe("completed");
  });
});
