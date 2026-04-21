import { describe, it, expect } from "vitest";
import { generateCustomerKey } from "@/lib/toss-client";

describe("toss-client 헬퍼", () => {
  describe("generateCustomerKey", () => {
    it("userId를 customer_ 접두어로 래핑한다", () => {
      expect(generateCustomerKey("user123")).toBe("customer_user123");
    });

    it("빈 문자열도 처리한다", () => {
      expect(generateCustomerKey("")).toBe("customer_");
    });

    it("UUID 형태의 userId도 처리한다", () => {
      const uuid = "abc12345-def6-7890-ghij-klmnop123456";
      expect(generateCustomerKey(uuid)).toBe(`customer_${uuid}`);
    });
  });
});
