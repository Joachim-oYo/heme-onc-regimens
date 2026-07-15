import { describe, it, expect } from "vitest";
import { buildIndex, computeHighlights, computeLineagePath } from "./graph";
import type { GraphData } from "./types";

/**
 * A small fixture graph:
 *   cells:    hsc -> myeloid -> myeloblast
 *                          \-> monoblast
 *   diseases: aml  (cells: myeloblast, monoblast)
 *             cml  (cells: myeloid)
 *   regimens: r73  (aml)
 *             cml_reg (cml)
 *   drugs:    cytarabine (r73), shared (r73, cml_reg), imatinib (cml_reg)
 */
const data: GraphData = {
  cells: [
    { id: "hsc", name: "HSC", parentId: null, order: 0 },
    { id: "myeloid", name: "Myeloid", parentId: "hsc", order: 0 },
    { id: "myeloblast", name: "Myeloblast", parentId: "myeloid", order: 0 },
    { id: "monoblast", name: "Monoblast", parentId: "myeloid", order: 1 },
    { id: "lonely", name: "Lonely cell", parentId: null, order: 0 },
  ],
  diseases: [
    { id: "aml", name: "AML", abbreviation: "AML", cellIds: ["myeloblast", "monoblast"] },
    { id: "cml", name: "CML", abbreviation: "CML", cellIds: ["myeloid"] },
  ],
  regimens: [
    { id: "r73", name: "7+3", diseaseIds: ["aml"] },
    { id: "cml_reg", name: "CML reg", diseaseIds: ["cml"] },
  ],
  drugs: [
    { id: "cytarabine", name: "Cytarabine", mechanism: "", toxicities: [], regimenIds: ["r73"] },
    { id: "shared", name: "Shared", mechanism: "", toxicities: [], regimenIds: ["r73", "cml_reg"] },
    { id: "imatinib", name: "Imatinib", mechanism: "", toxicities: [], regimenIds: ["cml_reg"] },
  ],
};

const index = buildIndex(data);

describe("buildIndex", () => {
  it("derives downward adjacency", () => {
    expect(index.cellToDiseases.get("myeloblast")).toEqual(["aml"]);
    expect(index.cellToDiseases.get("myeloid")).toEqual(["cml"]);
    expect(index.diseaseToRegimens.get("aml")).toEqual(["r73"]);
    expect(index.regimenToDrugs.get("r73")?.sort()).toEqual(["cytarabine", "shared"]);
  });

  it("derives lineage children", () => {
    expect(index.cellChildren.get("hsc")).toEqual(["myeloid"]);
    expect(index.cellChildren.get("myeloid")?.sort()).toEqual(["monoblast", "myeloblast"]);
  });
});

describe("computeHighlights — sweep DOWN from a cell", () => {
  it("myeloblast -> aml -> r73 -> {cytarabine, shared}", () => {
    const hl = computeHighlights(index, { kind: "cell", id: "myeloblast" });
    expect([...hl.cells]).toEqual(["myeloblast"]);
    expect([...hl.diseases]).toEqual(["aml"]);
    expect([...hl.regimens]).toEqual(["r73"]);
    expect([...hl.drugs].sort()).toEqual(["cytarabine", "shared"]);
  });

  it("does NOT highlight lineage ancestors/descendants via cascade", () => {
    const hl = computeHighlights(index, { kind: "cell", id: "myeloblast" });
    expect(hl.cells.has("myeloid")).toBe(false);
    expect(hl.cells.has("hsc")).toBe(false);
  });
});

describe("computeHighlights — sweep UP from a drug", () => {
  it("imatinib -> cml_reg -> cml -> myeloid", () => {
    const hl = computeHighlights(index, { kind: "drug", id: "imatinib" });
    expect([...hl.drugs]).toEqual(["imatinib"]);
    expect([...hl.regimens]).toEqual(["cml_reg"]);
    expect([...hl.diseases]).toEqual(["cml"]);
    expect([...hl.cells]).toEqual(["myeloid"]);
  });

  it("shared drug reaches both regimens, both diseases, all their cells", () => {
    const hl = computeHighlights(index, { kind: "drug", id: "shared" });
    expect([...hl.regimens].sort()).toEqual(["cml_reg", "r73"]);
    expect([...hl.diseases].sort()).toEqual(["aml", "cml"]);
    expect([...hl.cells].sort()).toEqual(["monoblast", "myeloblast", "myeloid"]);
  });
});

describe("computeHighlights — middle selection sweeps BOTH ways", () => {
  it("regimen r73 -> up to aml + its cells, down to its drugs", () => {
    const hl = computeHighlights(index, { kind: "regimen", id: "r73" });
    expect([...hl.regimens]).toEqual(["r73"]);
    // up
    expect([...hl.diseases]).toEqual(["aml"]);
    expect([...hl.cells].sort()).toEqual(["monoblast", "myeloblast"]);
    // down
    expect([...hl.drugs].sort()).toEqual(["cytarabine", "shared"]);
  });

  it("disease aml -> up to its cells, down to regimen + drugs", () => {
    const hl = computeHighlights(index, { kind: "disease", id: "aml" });
    expect([...hl.cells].sort()).toEqual(["monoblast", "myeloblast"]);
    expect([...hl.diseases]).toEqual(["aml"]);
    expect([...hl.regimens]).toEqual(["r73"]);
    expect([...hl.drugs].sort()).toEqual(["cytarabine", "shared"]);
  });
});

describe("computeHighlights — disconnected entity", () => {
  it("a cell with no diseases highlights only itself", () => {
    const hl = computeHighlights(index, { kind: "cell", id: "lonely" });
    expect([...hl.cells]).toEqual(["lonely"]);
    expect(hl.diseases.size).toBe(0);
    expect(hl.regimens.size).toBe(0);
    expect(hl.drugs.size).toBe(0);
  });
});

describe("computeLineagePath", () => {
  it("returns ancestors and descendants, excluding the cell itself", () => {
    const path = computeLineagePath(index, "myeloid");
    expect(path.has("myeloid")).toBe(false);
    expect(path.has("hsc")).toBe(true); // ancestor
    expect(path.has("myeloblast")).toBe(true); // descendant
    expect(path.has("monoblast")).toBe(true); // descendant
  });

  it("root cell has only descendants", () => {
    const path = computeLineagePath(index, "hsc");
    expect([...path].sort()).toEqual(["monoblast", "myeloblast", "myeloid"]);
  });
});
