import { describe, it, expect } from "vitest";
import { parseTime, calculateHours } from "@/lib/attendance-utils";

describe("parseTime — HH:mm 파싱", () => {
  it("정상 시간 파싱", () => {
    expect(parseTime("09:00")).toEqual({ h: 9, m: 0 });
    expect(parseTime("23:59")).toEqual({ h: 23, m: 59 });
    expect(parseTime("0:00")).toEqual({ h: 0, m: 0 });
  });

  it("잘못된 형식 → null", () => {
    expect(parseTime("")).toBeNull();
    expect(parseTime("abc")).toBeNull();
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime("12:60")).toBeNull();
    expect(parseTime("12")).toBeNull();
    expect(parseTime("12:5")).toBeNull();
    expect(parseTime("-1:00")).toBeNull();
  });

  it("경계값 테스트", () => {
    expect(parseTime("00:00")).toEqual({ h: 0, m: 0 });
    expect(parseTime("23:59")).toEqual({ h: 23, m: 59 });
    expect(parseTime("24:00")).toBeNull();
  });
});

describe("calculateHours — 근무시간 계산", () => {
  it("정상 근무 (8시간)", () => {
    const result = calculateHours("09:00", "18:00");
    expect(result).not.toBeNull();
    expect(result!.hoursWorked).toBe(9);
    expect(result!.overtimeHours).toBe(1);
  });

  it("야근 없는 근무 (8시간 이하)", () => {
    const result = calculateHours("09:00", "17:00");
    expect(result!.hoursWorked).toBe(8);
    expect(result!.overtimeHours).toBe(0);
  });

  it("야근 있는 근무 (12시간)", () => {
    const result = calculateHours("08:00", "20:00");
    expect(result!.hoursWorked).toBe(12);
    expect(result!.overtimeHours).toBe(4);
  });

  it("null/undefined 입력 → null", () => {
    expect(calculateHours(null, "18:00")).toBeNull();
    expect(calculateHours("09:00", null)).toBeNull();
    expect(calculateHours(null, null)).toBeNull();
    expect(calculateHours(undefined, "18:00")).toBeNull();
  });

  it("잘못된 시간 형식 → null", () => {
    expect(calculateHours("abc", "18:00")).toBeNull();
    expect(calculateHours("09:00", "25:00")).toBeNull();
  });

  it("출근이 퇴근보다 늦으면 0시간", () => {
    const result = calculateHours("18:00", "09:00");
    expect(result!.hoursWorked).toBe(0);
    expect(result!.overtimeHours).toBe(0);
  });

  it("같은 시간 출퇴근 → 0시간", () => {
    const result = calculateHours("09:00", "09:00");
    expect(result!.hoursWorked).toBe(0);
    expect(result!.overtimeHours).toBe(0);
  });
});
