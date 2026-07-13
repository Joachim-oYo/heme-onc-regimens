import { describe, it, expect } from "vitest";
import { validateReferentialIntegrity, wouldCreateLineageCycle } from "./mutations";
import { makeId, slugify } from "./ids";
import type { GraphData } from "./types";

const valid: GraphData = {
  cells: [
    { id: "a", name: "A", parentId: null, lineage: null, order: 0 },
    { id: "b", name: "B", parentId: "a", lineage: null, order: 0 },
  ],
  diseases: [{ id: "d", name: "D", abbreviation: null, cellIds: ["a"] }],
  regimens: [{ id: "r", name: "R", diseaseIds: ["d"] }],
  drugs: [{ id: "x", name: "X", mechanism: "", toxicities: [], regimenIds: ["r"] }],
};

describe("validateReferentialIntegrity", () => {
  it("passes for a consistent graph", () => {
    expect(validateReferentialIntegrity(valid)).toEqual([]);
  });

  it("flags a dangling cell parent", () => {
    const bad = structuredClone(valid);
    bad.cells[1].parentId = "ghost";
    expect(validateReferentialIntegrity(bad)).toContain(
      'Cell "b" has unknown parentId "ghost"',
    );
  });

  it("flags a dangling cross-tier edge", () => {
    const bad = structuredClone(valid);
    bad.drugs[0].regimenIds = ["nope"];
    expect(validateReferentialIntegrity(bad)).toContain(
      'Drug "x" references unknown regimen "nope"',
    );
  });
});

describe("wouldCreateLineageCycle", () => {
  const cells = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
  ];

  it("rejects self-parenting", () => {
    expect(wouldCreateLineageCycle(cells, "a", "a")).toBe(true);
  });

  it("rejects making an ancestor a child of its descendant", () => {
    // Setting a's parent to c would create a -> c -> b -> a cycle.
    expect(wouldCreateLineageCycle(cells, "a", "c")).toBe(true);
  });

  it("allows a valid reparent", () => {
    expect(wouldCreateLineageCycle(cells, "c", "a")).toBe(false);
  });

  it("allows clearing the parent", () => {
    expect(wouldCreateLineageCycle(cells, "b", null)).toBe(false);
  });
});

describe("ids", () => {
  it("slugifies names", () => {
    expect(slugify("7+3 induction")).toBe("7-3-induction");
    expect(slugify("R-CHOP")).toBe("r-chop");
    expect(slugify("  Hello  World  ")).toBe("hello-world");
  });

  it("generates prefixed ids and avoids collisions", () => {
    expect(makeId("drug", "Cytarabine", [])).toBe("drug_cytarabine");
    expect(makeId("cell", "HSC", [])).toBe("cell_hsc");
    expect(makeId("drug", "Cytarabine", ["drug_cytarabine"])).toBe("drug_cytarabine_2");
    expect(
      makeId("drug", "Cytarabine", ["drug_cytarabine", "drug_cytarabine_2"]),
    ).toBe("drug_cytarabine_3");
  });
});
