import { describe, it, expect, vi, beforeEach } from "vitest";
import { log } from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  log: vi.fn().mockResolvedValue(undefined),
}));

const mockAddRow = vi.fn().mockResolvedValue(undefined);

vi.mock("google-spreadsheet", () => {
  return {
    GoogleSpreadsheet: function () {
      return {
        loadInfo: vi.fn().mockResolvedValue(undefined),
        sheetsByIndex: [{ addRow: mockAddRow }],
      };
    },
  };
});

vi.mock("google-auth-library", () => {
  return {
    JWT: function () {
      return {};
    },
  };
});

import { handleGitHub } from "@/lib/handlers/github";
import { handleSheets } from "@/lib/handlers/sheets";
import { handleUncategorized } from "@/lib/handlers/uncategorized";

const mockedLog = vi.mocked(log);

describe("handlers", () => {
  beforeEach(() => {
    mockedLog.mockClear();
    mockAddRow.mockClear();
  });

  it("github handler calls logger.log at start and end", async () => {
    await handleGitHub("Buy milk", 1);

    const calls = mockedLog.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0][2]).toBe("started");
    expect(calls[calls.length - 1][2]).toBe("completed");
  });

  it("sheets handler calls logger.log at start and end", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "test@test.iam.gserviceaccount.com");
    vi.stubEnv("GOOGLE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----\\n");

    await handleSheets("New idea", 2);

    const calls = mockedLog.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0][2]).toBe("started");
    expect(calls[calls.length - 1][2]).toBe("completed");

    vi.unstubAllEnvs();
  });

  it("uncategorized handler calls logger.log at start and end", async () => {
    await handleUncategorized("Random thought", 3);

    const calls = mockedLog.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0][2]).toBe("started");
    expect(calls[calls.length - 1][2]).toBe("completed");
  });
});
