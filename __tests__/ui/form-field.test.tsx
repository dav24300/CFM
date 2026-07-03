/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FormField } from "@/components/ui/patterns/form-field";
import { Input } from "@/components/ui/primitives/input";

afterEach(() => cleanup());

describe("FormField", () => {
  it("links label to input via htmlFor", () => {
    render(
      <FormField label="Email" htmlFor="email" required>
        <Input type="email" />
      </FormField>
    );

    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("id")).toBe("email");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("sets aria-invalid and shows error message", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Email invalide">
        <Input type="email" />
      </FormField>
    );

    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("email-error");
    expect(screen.getByRole("alert").textContent).toBe("Email invalide");
  });
});
