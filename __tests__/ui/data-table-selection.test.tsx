/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DataTable, type Column } from "@/components/admin/ui/data-table";

afterEach(() => cleanup());

type Row = { id: number; nom: string; status: string } & Record<string, unknown>;

const COLS: Column<Row>[] = [
  { key: "nom", header: "Nom" },
  { key: "status", header: "Statut" },
];

// 12 lignes = 2 pages (pageSize 10) : indispensable pour vérifier que « tout
// sélectionner » porte sur l'ensemble filtré et pas seulement la page visible.
const ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  nom: `Membre ${i + 1}`,
  status: i < 8 ? "pending" : "active",
}));

function boxes() {
  return screen.getAllByRole("checkbox") as HTMLInputElement[];
}

describe("DataTable — sélection multiple", () => {
  it("n'affiche aucune case quand selectable est absent (rétro-compatibilité)", () => {
    render(<DataTable data={ROWS} columns={COLS} rowKey={(r) => r.id} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("sélectionne une ligne et expose la ligne au rendu d'actions groupées", () => {
    const bulk = vi.fn((_selected: Row[], _clear: () => void) => (
      <button type="button">Agir</button>
    ));
    render(
      <DataTable data={ROWS} columns={COLS} rowKey={(r) => r.id} selectable bulkActions={bulk} />
    );

    // 1 case d'en-tête + 10 lignes de la page courante
    expect(boxes()).toHaveLength(11);
    fireEvent.click(boxes()[1]);

    const selected = bulk.mock.calls.at(-1)![0] as Row[];
    expect(selected.map((r) => r.id)).toEqual([1]);
    expect(screen.getByText("1 sélectionné")).toBeTruthy();
  });

  it("« tout sélectionner » couvre les 12 lignes, pas seulement la page affichée", () => {
    const bulk = vi.fn((_selected: Row[], _clear: () => void) => (
      <button type="button">Agir</button>
    ));
    render(
      <DataTable data={ROWS} columns={COLS} rowKey={(r) => r.id} selectable bulkActions={bulk} />
    );

    fireEvent.click(boxes()[0]);

    const selected = bulk.mock.calls.at(-1)![0] as Row[];
    expect(selected).toHaveLength(12);
    expect(screen.getByText("12 sélectionnés")).toBeTruthy();
  });

  it("restreint la sélection globale au sous-ensemble filtré par la recherche", () => {
    const bulk = vi.fn((_selected: Row[], _clear: () => void) => (
      <button type="button">Agir</button>
    ));
    render(
      <DataTable
        data={ROWS}
        columns={COLS}
        rowKey={(r) => r.id}
        searchKeys={["nom"]}
        selectable
        bulkActions={bulk}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Rechercher…"), {
      target: { value: "Membre 1" },
    });
    fireEvent.click(boxes()[0]);

    // "Membre 1", "Membre 10", "Membre 11", "Membre 12"
    const selected = bulk.mock.calls.at(-1)![0] as Row[];
    expect(selected.map((r) => r.id).sort((a, b) => a - b)).toEqual([1, 10, 11, 12]);
  });

  it("laisse l'appelant vider la sélection", () => {
    const bulk = vi.fn((_: Row[], clear: () => void) => (
      <button type="button" onClick={clear}>
        Vider
      </button>
    ));
    render(
      <DataTable data={ROWS} columns={COLS} rowKey={(r) => r.id} selectable bulkActions={bulk} />
    );

    fireEvent.click(boxes()[0]);
    expect(screen.getByText("12 sélectionnés")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Vider" }));
    expect(screen.queryByText("12 sélectionnés")).toBeNull();
  });

  it("retire de la sélection une ligne disparue du jeu de données", () => {
    const bulk = vi.fn((_selected: Row[], _clear: () => void) => (
      <button type="button">Agir</button>
    ));
    const { rerender } = render(
      <DataTable data={ROWS} columns={COLS} rowKey={(r) => r.id} selectable bulkActions={bulk} />
    );

    fireEvent.click(boxes()[0]);
    expect((bulk.mock.calls.at(-1)![0] as Row[])).toHaveLength(12);

    // Rechargement des données après action : 4 lignes ont disparu.
    rerender(
      <DataTable
        data={ROWS.slice(0, 8)}
        columns={COLS}
        rowKey={(r) => r.id}
        selectable
        bulkActions={bulk}
      />
    );
    expect((bulk.mock.calls.at(-1)![0] as Row[])).toHaveLength(8);
  });
});
