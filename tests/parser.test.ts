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
});
