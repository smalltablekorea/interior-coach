import { describe, it, expect } from "vitest";
import { areaCoeff, rooms, baths, GRADES, CATS, calcCatTotal, fmt, fmtM, fmtShort } from "@/lib/estimate-engine";

describe("areaCoeff (면적 계수)", () => {
  it("10평 이하는 1.18", () => {
    expect(areaCoeff(8)).toBe(1.18);
    expect(areaCoeff(10)).toBe(1.18);
  });

  it("32평은 기준값 1.0", () => {
    expect(areaCoeff(32)).toBe(1.0);
  });

  it("100평 이상은 0.82", () => {
    expect(areaCoeff(100)).toBe(0.82);
    expect(areaCoeff(120)).toBe(0.82);
  });

  it("보간이 적용되어 중간값이 나온다", () => {
    // 25평: 20평(1.10)과 26평(1.04) 사이
    const coeff25 = areaCoeff(25);
    expect(coeff25).toBeGreaterThan(1.04);
    expect(coeff25).toBeLessThan(1.10);
  });

  it("경계값에서 연속적이다", () => {
    // 20평에서 값이 점프하지 않아야 함
    const at20 = areaCoeff(20);
    const at21 = areaCoeff(21);
    expect(Math.abs(at20 - at21)).toBeLessThan(0.02);
  });
});

describe("rooms & baths", () => {
  it("면적에 따라 방 수가 증가한다", () => {
    expect(rooms(10)).toBe(1);
    expect(rooms(27)).toBe(4);
    expect(rooms(50)).toBe(6);
  });

  it("면적에 따라 욕실 수가 증가한다", () => {
    expect(baths(20)).toBe(1);
    expect(baths(30)).toBe(2);
    expect(baths(70)).toBe(3);
  });
});

describe("GRADES", () => {
  it("8개 등급이 존재한다", () => {
    expect(GRADES).toHaveLength(8);
  });

  it("등급 mult가 오름차순이다", () => {
    for (let i = 1; i < GRADES.length; i++) {
      expect(GRADES[i].mult).toBeGreaterThan(GRADES[i - 1].mult);
    }
  });

  it("모든 등급에 key, label, color가 있다", () => {
    GRADES.forEach((g) => {
      expect(g.key).toBeTruthy();
      expect(g.label).toBeTruthy();
      expect(g.color).toBeTruthy();
    });
  });
});

describe("CATS (공종 목록)", () => {
  it("15개 공종이 존재한다", () => {
    expect(CATS.length).toBe(15);
  });

  it("모든 공종에 id, name, subs가 있다", () => {
    CATS.forEach((cat) => {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.subs.length).toBeGreaterThan(0);
    });
  });

  it("필수 공종이 하나 이상 있다", () => {
    const essentials = CATS.filter((c) => c.essential);
    expect(essentials.length).toBeGreaterThan(0);
  });
});

describe("calcCatTotal", () => {
  it("양수 금액을 반환한다", () => {
    const cat = CATS[0]; // demolition
    const total = calcCatTotal(cat, 27, "standard");
    expect(total).toBeGreaterThan(0);
  });

  it("면적이 클수록 금액이 커진다", () => {
    const cat = CATS[0];
    const small = calcCatTotal(cat, 15, "standard");
    const large = calcCatTotal(cat, 60, "standard");
    expect(large).toBeGreaterThan(small);
  });

  it("등급이 높을수록 금액이 커진다", () => {
    const cat = CATS.find((c) => c.id === "carpentry")!;
    const basic = calcCatTotal(cat, 27, "basic");
    const premium = calcCatTotal(cat, 27, "premium");
    expect(premium).toBeGreaterThan(basic);
  });
});

describe("fmt functions", () => {
  it("fmt: 원화 포맷", () => {
    expect(fmt(1000000)).toContain("1,000,000");
    expect(fmt(0)).toBe("₩0");
    expect(fmt(null)).toBe("₩0");
  });

  it("fmtM: 만원 단위", () => {
    expect(fmtM(10000000)).toContain("1,000만");
    expect(fmtM(100000000)).toContain("억");
  });

  it("fmtShort: 축약 포맷", () => {
    expect(fmtShort(150000000)).toContain("억");
    expect(fmtShort(35000000)).toContain("천만");
  });
});
