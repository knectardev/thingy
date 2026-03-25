import { describe, it, expect } from "vitest";
import { resolveIngestRouting } from "@/lib/ingest-routing";

describe("resolveIngestRouting", () => {
  it("delegates to parser when routing is absent", () => {
    const r = resolveIngestRouting("Buy milk #task");
    expect(r.token).toBe("task");
    expect(r.content).toBe("Buy milk");
    expect(r.contextToken).toBeNull();
  });

  it("GitHub mode uses feature token and optional repo context", () => {
    const r = resolveIngestRouting("Hello", { mode: "github" });
    expect(r).toEqual({ content: "Hello", token: "feature", contextToken: null });

    const r2 = resolveIngestRouting("Hello", { mode: "github", secondary: "Thingy" });
    expect(r2).toEqual({ content: "Hello", token: "feature", contextToken: "thingy" });
  });

  it("Email mode maps secondary to handler tokens", () => {
    expect(resolveIngestRouting("Hi", { mode: "email", secondary: "chris" }).token).toBe(
      "emailchris"
    );
    expect(resolveIngestRouting("Hi", { mode: "email", secondary: "alana" }).token).toBe(
      "emailalana"
    );
    expect(resolveIngestRouting("Hi", { mode: "email" }).token).toBe("emailchris");
  });

  it("Spreadsheet mode maps secondary to handler tokens", () => {
    expect(resolveIngestRouting("Hi", { mode: "spreadsheet", secondary: "idea" }).token).toBe(
      "idea"
    );
    expect(resolveIngestRouting("Hi", { mode: "spreadsheet", secondary: "tshirt" }).token).toBe(
      "tshirt"
    );
    expect(resolveIngestRouting("Hi", { mode: "spreadsheet" }).token).toBe("idea");
  });

  it("still strips hashtags from content when UI routing is used", () => {
    const r = resolveIngestRouting("Note body #task", { mode: "github" });
    expect(r.content).toBe("Note body");
    expect(r.token).toBe("feature");
  });
});
