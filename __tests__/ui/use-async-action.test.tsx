/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

afterEach(() => cleanup());

function TestHarness({ shouldFail = false }: { shouldFail?: boolean }) {
  const { status, error, run, isLoading } = useAsyncAction<string>();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          run(async () => {
            if (shouldFail) throw new Error("Échec");
            return "ok";
          })
        }
      >
        Exécuter
      </button>
      <span data-testid="status">{status}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      {error && <span data-testid="error">{error}</span>}
    </div>
  );
}

describe("useAsyncAction", () => {
  it("transitions idle → loading → success", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "Exécuter" }));

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("success");
    });
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it("transitions to error on failure", async () => {
    const user = userEvent.setup();
    render(<TestHarness shouldFail />);

    await user.click(screen.getByRole("button", { name: "Exécuter" }));

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("error");
    });
    expect(screen.getByTestId("error").textContent).toBe("Échec");
  });
});
