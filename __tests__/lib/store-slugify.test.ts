import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/store";

describe("store slugify", () => {
  it("normalizes accents and punctuation", () => {
    expect(slugify("Réforme Protection! 2026")).toBe("reforme-protection-2026");
  });

  it("collapses spaces into dashes", () => {
    expect(slugify("CFM   familles   militaires")).toBe("cfm-familles-militaires");
  });
});
