import { describe, it, expect } from "vitest";
import { TRADES } from "@/lib/schedule-planner/trades";

describe("schedule-planner/trades — 공종 데이터 무결성", () => {
  it("공종 목록이 존재", () => {
    expect(TRADES.length).toBeGreaterThan(10);
  });

  it("모든 공종에 필수 필드", () => {
    for (const trade of TRADES) {
      expect(trade.id).toBeTruthy();
      expect(trade.name).toBeTruthy();
      expect(trade.icon).toBeTruthy();
      expect(trade.group).toBeTruthy();
      expect(typeof trade.phase).toBe("number");
      expect(typeof trade.baseDays).toBe("number");
      expect(trade.baseDays).toBeGreaterThan(0);
      expect(typeof trade.costMin).toBe("number");
      expect(typeof trade.costMax).toBe("number");
      expect(trade.costMax).toBeGreaterThanOrEqual(trade.costMin);
      expect(trade.unit).toBeTruthy();
      expect(trade.skipRisk).toMatch(/^(critical|high|medium|low)$/);
      expect(trade.desc).toBeTruthy();
    }
  });

  it("ID가 고유함", () => {
    const ids = TRADES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("phase 순서대로 (1부터 시작)", () => {
    const phases = TRADES.map(t => t.phase);
    expect(Math.min(...phases)).toBe(1);
  });

  it("deps는 유효한 trade ID만 참조", () => {
    const ids = new Set(TRADES.map(t => t.id));
    for (const trade of TRADES) {
      for (const dep of trade.deps) {
        expect(ids.has(dep), `${trade.id} depends on unknown "${dep}"`).toBe(true);
      }
    }
  });

  it("parallel은 유효한 trade ID만 참조", () => {
    const ids = new Set(TRADES.map(t => t.id));
    for (const trade of TRADES) {
      for (const p of trade.parallel) {
        expect(ids.has(p), `${trade.id} parallels unknown "${p}"`).toBe(true);
      }
    }
  });

  it("철거가 첫 phase", () => {
    const demolition = TRADES.find(t => t.id === "demolition");
    expect(demolition).toBeDefined();
    expect(demolition!.phase).toBe(1);
    expect(demolition!.deps).toHaveLength(0);
  });

  it("qualityCheck가 배열", () => {
    for (const trade of TRADES) {
      expect(Array.isArray(trade.qualityCheck)).toBe(true);
      expect(trade.qualityCheck.length).toBeGreaterThan(0);
    }
  });

  it("prework 항목에 필수 필드", () => {
    for (const trade of TRADES) {
      for (const pw of trade.prework) {
        expect(pw.task).toBeTruthy();
        expect(typeof pw.leadDays).toBe("number");
        expect(pw.category).toBeTruthy();
      }
    }
  });

  it("materials 항목에 필수 필드", () => {
    for (const trade of TRADES) {
      for (const mat of trade.materials) {
        expect(mat.name).toBeTruthy();
        expect(typeof mat.leadDays).toBe("number");
        expect(mat.category).toBeTruthy();
      }
    }
  });
});
