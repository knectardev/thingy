import { describe, it, expect } from "vitest";
import { parseInput } from "@/lib/parser";

describe("parseInput", () => {
  it("extracts a trailing token from the text", () => {
    const result = parseInput("Buy milk #task");
    expect(result).toEqual({ content: "Buy milk", token: "task" });
  });

  it("returns null token when no token is present", () => {
    const result = parseInput("Random thought");
    expect(result).toEqual({ content: "Random thought", token: null });
  });

  it("extracts compound #lendl task token", () => {
    const result = parseInput("Fix the auth flow #lendl task");
    expect(result).toEqual({ content: "Fix the auth flow", token: "lendl" });
  });

  it("extracts compound #lendle task (typo variant)", () => {
    const result = parseInput("Redesign onboarding #lendle task");
    expect(result).toEqual({ content: "Redesign onboarding", token: "lendl" });
  });

  it("handles #lendl task case-insensitively", () => {
    const result = parseInput("Add rate limiting #Lendl Task");
    expect(result).toEqual({ content: "Add rate limiting", token: "lendl" });
  });

  it("still matches simple tokens after compound check", () => {
    const result = parseInput("T-shirt design #tshirt");
    expect(result).toEqual({ content: "T-shirt design", token: "tshirt" });
  });

  it("extracts compound #email chris token", () => {
    const result = parseInput("Draft a response to John #email chris");
    expect(result).toEqual({ content: "Draft a response to John", token: "emailchris" });
  });

  it("extracts compound #email alana token", () => {
    const result = parseInput("Pick up groceries #email alana");
    expect(result).toEqual({ content: "Pick up groceries", token: "emailalana" });
  });

  it("handles #email chris case-insensitively", () => {
    const result = parseInput("Meeting notes #Email Chris");
    expect(result).toEqual({ content: "Meeting notes", token: "emailchris" });
  });

  it("treats 'hashtag' as equivalent to #", () => {
    const result = parseInput("Buy milk hashtag task");
    expect(result).toEqual({ content: "Buy milk", token: "task" });
  });

  it("treats 'keyword' as equivalent to #", () => {
    const result = parseInput("New concept keyword idea");
    expect(result).toEqual({ content: "New concept", token: "idea" });
  });

  it("handles 'hashtag' with compound tokens", () => {
    const result = parseInput("Fix the login hashtag email chris");
    expect(result).toEqual({ content: "Fix the login", token: "emailchris" });
  });

  it("handles 'Hashtag' case-insensitively", () => {
    const result = parseInput("Deploy update Hashtag lot");
    expect(result).toEqual({ content: "Deploy update", token: "lot" });
  });

  it("handles spaces after # in simple tokens", () => {
    const result = parseInput("test message # task");
    expect(result).toEqual({ content: "test message", token: "task" });
  });

  it("handles spaces after # in compound tokens", () => {
    const result = parseInput("test this message # email Chris");
    expect(result).toEqual({ content: "test this message", token: "emailchris" });
  });

  it("handles spaces after hashtag keyword equivalent", () => {
    const result = parseInput("reminder hashtag  email alana");
    expect(result).toEqual({ content: "reminder", token: "emailalana" });
  });
});
