import { describe, it, expect } from "vitest";
import { ok, err, notFound, forbidden, serverError } from "@/lib/api/response";

describe("API Response helpers", () => {
  describe("ok()", () => {
    it("returns 200 with data", async () => {
      const data = { id: 1, name: "테스트" };
      const res = ok(data);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(data);
    });

    it("handles arrays", async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const res = ok(data);
      const body = await res.json();
      expect(body).toHaveLength(2);
    });

    it("handles null data", async () => {
      const res = ok(null);
      const body = await res.json();
      expect(body).toBeNull();
    });
  });

  describe("err()", () => {
    it("returns 400 by default", async () => {
      const res = err("잘못된 요청");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("잘못된 요청");
    });

    it("supports custom status codes", async () => {
      const res = err("custom", 422);
      expect(res.status).toBe(422);
    });
  });

  describe("notFound()", () => {
    it("returns 404", async () => {
      const res = notFound();
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("accepts custom message", async () => {
      const res = notFound("견적서를 찾을 수 없습니다");
      const body = await res.json();
      expect(body.error).toContain("견적서");
    });
  });

  describe("forbidden()", () => {
    it("returns 403", async () => {
      const res = forbidden();
      expect(res.status).toBe(403);
    });
  });

  describe("serverError()", () => {
    it("returns 500 with Error message", async () => {
      const res = serverError(new Error("DB 연결 실패"));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toContain("DB 연결 실패");
    });

    it("returns 500 with fallback for non-Error", async () => {
      const res = serverError("string error");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });
  });
});
