import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  log: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/handlers/github", () => ({
  handleGitHub: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/handlers/sheets", () => ({
  handleSheets: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/handlers/gmail", () => ({
  emailChris: vi.fn().mockResolvedValue(undefined),
  emailAlana: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/handlers/uncategorized", () => ({
  handleUncategorized: vi.fn().mockResolvedValue(undefined),
}));

import { route } from "@/lib/router";
import { handleGitHub } from "@/lib/handlers/github";
import { handleSheets } from "@/lib/handlers/sheets";
import { emailChris, emailAlana } from "@/lib/handlers/gmail";

describe("route", () => {
  it("maps 'task' to GitHub handler and 'idea' to Sheets handler", async () => {
    await route("Buy milk", "task", 1);
    expect(handleGitHub).toHaveBeenCalledWith("Buy milk", 1);

    await route("New feature concept", "idea", 2);
    expect(handleSheets).toHaveBeenCalledWith("New feature concept", 2);
  });

  it("maps 'lendl' and 'lendle' to GitHub handler", async () => {
    await route("Fix auth flow", "lendl", 10);
    expect(handleGitHub).toHaveBeenCalledWith("Fix auth flow", 10);

    await route("Add rate limiting", "lendle", 11);
    expect(handleGitHub).toHaveBeenCalledWith("Add rate limiting", 11);
  });

  it("maps 'emailchris' and 'emailalana' to Gmail handlers", async () => {
    await route("Draft a response", "emailchris", 20);
    expect(emailChris).toHaveBeenCalledWith("Draft a response", 20);

    await route("Pick up groceries", "emailalana", 21);
    expect(emailAlana).toHaveBeenCalledWith("Pick up groceries", 21);
  });
});
