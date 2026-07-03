import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("merges tailwind classes without conflicts", () => {
    expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
  });

  it("handles conditional classes", () => {
    expect(cn("text-cfm-navy", false && "hidden", "font-bold")).toBe("text-cfm-navy font-bold");
  });
});
