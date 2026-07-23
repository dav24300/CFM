/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;

let lastCallback: IOCallback | null = null;
let lastOptions: IntersectionObserverInit | undefined;
const disconnect = vi.fn();
const observe = vi.fn();

beforeEach(() => {
  lastCallback = null;
  lastOptions = undefined;
  disconnect.mockClear();
  observe.mockClear();

  // jsdom n'implémente pas IntersectionObserver.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IOCallback, options?: IntersectionObserverInit) {
        lastCallback = cb;
        lastOptions = options;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn();
      root = null;
      rootMargin = "";
      thresholds = [];
    }
  );

  // Par défaut : animations autorisées.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function target() {
  return screen.getByTestId("contenu").parentElement as HTMLElement;
}

describe("ScrollReveal", () => {
  it("masque l'élément au montage, pas dans le HTML rendu", () => {
    render(
      <ScrollReveal>
        <p data-testid="contenu">Bonjour</p>
      </ScrollReveal>
    );
    const el = target();
    expect(el.style.opacity).toBe("0");
    expect(el.style.transform).toBe("translateY(24px)");
    expect(observe).toHaveBeenCalledWith(el);
    // Le contenu est bien présent dans le DOM : seul le style le masque.
    expect(screen.getByText("Bonjour")).toBeTruthy();
  });

  it("révèle l'élément lorsqu'il entre dans le viewport, puis cesse d'observer", () => {
    render(
      <ScrollReveal delay={0.2}>
        <p data-testid="contenu">Bonjour</p>
      </ScrollReveal>
    );
    const el = target();

    act(() => lastCallback!([{ isIntersecting: true }]));

    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toBe("none");
    expect(el.style.transition).toContain("0.2s");
    expect(disconnect).toHaveBeenCalled();
  });

  it("ne révèle rien tant que l'élément n'est pas visible", () => {
    render(
      <ScrollReveal>
        <p data-testid="contenu">Bonjour</p>
      </ScrollReveal>
    );
    act(() => lastCallback!([{ isIntersecting: false }]));
    expect(target().style.opacity).toBe("0");
  });

  it("applique le décalage correspondant à la direction demandée", () => {
    render(
      <ScrollReveal direction="left">
        <p data-testid="contenu">Bonjour</p>
      </ScrollReveal>
    );
    expect(target().style.transform).toBe("translateX(-32px)");
  });

  it("conserve la marge de déclenchement de l'implémentation précédente", () => {
    render(
      <ScrollReveal>
        <p data-testid="contenu">Bonjour</p>
      </ScrollReveal>
    );
    expect(lastOptions?.rootMargin).toBe("-10% 0px");
  });

  it("n'applique aucune animation si l'utilisateur préfère les mouvements réduits", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));

    render(
      <ScrollReveal>
        <p data-testid="contenu">Bonjour</p>
      </ScrollReveal>
    );
    const el = target();
    expect(el.style.opacity).toBe("");
    expect(el.style.transform).toBe("");
    expect(observe).not.toHaveBeenCalled();
  });

  it("rend l'élément visible au démontage plutôt que de le laisser masqué", () => {
    const { unmount } = render(
      <ScrollReveal>
        <p data-testid="contenu">Bonjour</p>
      </ScrollReveal>
    );
    const el = target();
    expect(el.style.opacity).toBe("0");
    unmount();
    expect(el.style.opacity).toBe("");
    expect(disconnect).toHaveBeenCalled();
  });
});
