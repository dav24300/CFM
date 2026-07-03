/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/primitives/button";

afterEach(() => cleanup());

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Envoyer</Button>);
    expect(screen.getByRole("button", { name: "Envoyer" })).toBeTruthy();
  });

  it("sets aria-busy when loading", () => {
    render(<Button loading>Envoyer</Button>);
    const btn = screen.getByRole("button", { name: "Envoyer" });
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("applies variant classes", () => {
    render(<Button variant="secondary">Annuler</Button>);
    expect(screen.getByRole("button", { name: "Annuler" }).className).toContain("border-cfm-navy");
  });
});
