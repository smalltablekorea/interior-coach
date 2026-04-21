import { describe, it, expect } from "vitest";
import { generateOrderId, generateCustomerKey } from "@/lib/toss";

describe("toss 서버 헬퍼", () => {
  describe("generateOrderId", () => {
    it("IC- 접두어로 시작한다", () => {
      const id = generateOrderId("user123");
      expect(id).toMatch(/^IC-/);
    });

    it("날짜(YYYYMMDD) 형식이 포함된다", () => {
      const id = generateOrderId("user123");
      expect(id).toMatch(/^IC-\d{8}-/);
    });

    it("userId 앞 8자가 포함된다", () => {
      const id = generateOrderId("abcdefghijklmnop");
      expect(id).toContain("abcdefgh");
    });

    it("호출마다 다른 주문번호를 생성한다", () => {
      const id1 = generateOrderId("user1");
      const id2 = generateOrderId("user1");
      expect(id1).not.toBe(id2);
    });
  });

  describe("generateCustomerKey", () => {
    it("customer_ 접두어로 래핑한다", () => {
      expect(generateCustomerKey("user123")).toBe("customer_user123");
    });
  });
});
