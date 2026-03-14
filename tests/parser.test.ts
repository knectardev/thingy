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
});
