import { describe, expect, it } from "vitest";
import { pngToSvgFallback, resolveMediaPathClient } from "@/lib/infra/media-resolver";

describe("media-resolver", () => {
  it("maps png assets to svg fallback", () => {
    expect(pngToSvgFallback("/media/hero/home.png")).toBe("/media/hero/home.svg");
  });

  it("keeps svg and unknown formats unchanged", () => {
    expect(pngToSvgFallback("/media/hero/home.svg")).toBe("/media/hero/home.svg");
    expect(pngToSvgFallback("/media/hero/home.jpg")).toBe("/media/hero/home.jpg");
  });

  it("uses same fallback strategy on client helper", () => {
    expect(resolveMediaPathClient("/media/x.png")).toBe("/media/x.svg");
  });
});
