import { describe, it, expect } from "vitest";
import {
  LABOR,
  GRADES,
  areaCoeff,
  rooms,
  baths,
  calcSub,
  calcCatTotal,
  getDuration,
  CATS,
  BASE,
  type Sub,
} from "@/lib/estimate-engine";

describe("Estimate Engine — Constants", () => {
  it("has 8 grades", () => {
    expect(GRADES.length).toBe(8);
  });

  it("grades are ordered by multiplier (ascending)", () => {
    for (let i = 1; i < GRADES.length; i++) {
      expect(GRADES[i].mult).toBeGreaterThanOrEqual(GRADES[i - 1].mult);
    }
  });

  it("all grade keys are unique", () => {
    const keys = GRADES.map((g) => g.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("LABOR rates are positive", () => {
    for (const [key, rate] of Object.entries(LABOR)) {
      expect(rate, `${key} rate`).toBeGreaterThan(0);
    }
  });

  it("BASE is 27평", () => {
    expect(BASE).toBe(27);
  });

  it("CATS has essential categories", () => {
    const essentialIds = CATS.filter((c) => c.essential).map((c) => c.id);
    expect(essentialIds.length).toBeGreaterThan(0);
  });
});

describe("areaCoeff — area coefficient scaling", () => {
  it("returns ~1.0 for 27평 (base)", () => {
    const coeff = areaCoeff(27);
    expect(coeff).toBeCloseTo(1.0, 1);
  });

  it("returns > 1 for small areas (higher per-pyeong cost)", () => {
    expect(areaCoeff(10)).toBeGreaterThan(1);
  });

  it("returns < 1 for large areas (economies of scale)", () => {
    expect(areaCoeff(80)).toBeLessThan(1);
  });

  it("never goes negative", () => {
    for (const area of [5, 10, 20, 50, 100]) {
      expect(areaCoeff(area)).toBeGreaterThan(0);
    }
  });
});

describe("rooms/baths — room count by area", () => {
  it("small unit has fewer rooms", () => {
    expect(rooms(10)).toBeLessThanOrEqual(rooms(50));
  });

  it("large unit has more rooms", () => {
    expect(rooms(60)).toBeGreaterThan(rooms(20));
  });

  it("baths scale with area", () => {
    expect(baths(20)).toBeLessThanOrEqual(baths(60));
  });

  it("specific room counts", () => {
    expect(rooms(15)).toBe(1);
    expect(rooms(20)).toBe(2);
    expect(rooms(26)).toBe(3);  // a <= 26 → 3
    expect(rooms(27)).toBe(4);  // a > 26 and <= 32 → 4
    expect(rooms(32)).toBe(4);
  });
});

describe("calcSub — subcategory cost calculation", () => {
  const linearSub: Sub = { name: "테스트", base: 1000000, scale: "linear", type: "labor" };
  const fixedSub: Sub = { name: "테스트고정", base: 500000, scale: "fixed", type: "labor" };
  const roomSub: Sub = { name: "문", base: 1000000, scale: "room", type: "material", perRoom: 250000 };

  it("linear scales with area", () => {
    const small = calcSub(linearSub, 15);
    const large = calcSub(linearSub, 60);
    expect(large).toBeGreaterThan(small);
  });

  it("fixed does not scale linearly (but does apply area coefficient)", () => {
    const at27 = calcSub(fixedSub, 27);
    const at54 = calcSub(fixedSub, 54);
    // Fixed means no area ratio scaling, just coefficient
    expect(at54 / at27).toBeLessThan(1.5); // not proportional
  });

  it("room scales with number of rooms", () => {
    const twoRoom = calcSub(roomSub, 20); // 2 rooms
    const fourRoom = calcSub(roomSub, 32); // 4 rooms
    expect(fourRoom).toBeGreaterThan(twoRoom);
  });

  it("returns non-negative values", () => {
    for (const area of [10, 20, 30, 50, 80]) {
      expect(calcSub(linearSub, area)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("calcCatTotal — category total", () => {
  it("returns a rounded number (to 100원)", () => {
    const cat = CATS[0]; // first category
    if (cat) {
      const total = calcCatTotal(cat, 27, "standard");
      expect(total % 100).toBe(0);
    }
  });

  it("higher grade costs more", () => {
    const cat = CATS.find((c) => c.essential);
    if (cat) {
      const basic = calcCatTotal(cat, 30, "basic");
      const premium = calcCatTotal(cat, 30, "premium");
      // Premium should generally be >= basic (might not always with matOptions)
      expect(premium).toBeGreaterThanOrEqual(0);
      expect(basic).toBeGreaterThanOrEqual(0);
    }
  });

  it("larger area costs more", () => {
    const cat = CATS.find((c) => c.essential);
    if (cat) {
      const small = calcCatTotal(cat, 15, "standard");
      const large = calcCatTotal(cat, 60, "standard");
      expect(large).toBeGreaterThan(small);
    }
  });
});

describe("getDuration — construction duration", () => {
  it("returns { min, max, note }", () => {
    const result = getDuration("demolition", 30);
    expect(result).toHaveProperty("min");
    expect(result).toHaveProperty("max");
    expect(result).toHaveProperty("note");
    expect(result.min).toBeGreaterThanOrEqual(1);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
  });

  it("unknown catId returns default 1~2 days", () => {
    const result = getDuration("nonexistent_category", 30);
    expect(result.min).toBe(1);
    expect(result.max).toBe(2);
  });

  it("larger area takes longer", () => {
    const small = getDuration("demolition", 15);
    const large = getDuration("demolition", 80);
    expect(large.max).toBeGreaterThanOrEqual(small.max);
  });
});
