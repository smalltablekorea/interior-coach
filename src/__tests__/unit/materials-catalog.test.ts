import { describe, it, expect } from "vitest";
import { materialsCatalog, type CatalogMaterial } from "@/lib/materials-catalog";

describe("materialsCatalog — 자재 카탈로그 무결성", () => {
  it("카탈로그에 항목이 존재", () => {
    expect(materialsCatalog.length).toBeGreaterThan(100);
  });

  it("모든 항목에 필수 필드 존재", () => {
    for (const mat of materialsCatalog) {
      expect(mat.id).toBeTruthy();
      expect(mat.category).toBeTruthy();
      expect(mat.name).toBeTruthy();
      expect(typeof mat.unitPrice).toBe("number");
      expect(mat.unit).toBeTruthy();
    }
  });

  it("ID가 고유함 (중복 없음)", () => {
    const ids = materialsCatalog.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("단가가 모두 양수", () => {
    for (const mat of materialsCatalog) {
      expect(mat.unitPrice).toBeGreaterThan(0);
    }
  });

  it("카테고리에 주요 분류 존재", () => {
    const categories = new Set(materialsCatalog.map(m => m.category.split(" > ")[0]));
    const expected = ["가구", "타일"];
    for (const cat of expected) {
      expect(Array.from(categories).some(c => c.includes(cat))).toBe(true);
    }
  });

  it("grade 값이 비어있지 않음", () => {
    for (const mat of materialsCatalog) {
      expect(mat.grade).toBeDefined();
    }
  });

  it("ID 형식: mat-NNNN", () => {
    for (const mat of materialsCatalog) {
      expect(mat.id).toMatch(/^mat-\d+$/);
    }
  });
});
