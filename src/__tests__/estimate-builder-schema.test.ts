import { describe, it, expect } from "vitest";
import { estimateBuilderSchema } from "@/app/api/v1/estimates/route";

const validInput = {
  title: "강남구 아파트 리모델링",
  clientName: "홍길동",
  siteAddress: "서울시 강남구 역삼동 12-3",
  clientPhone: "010-1234-5678",
  estimateDate: "2026-04-16",
  areaPyeong: "32",
  gradeKey: "premium",
  gradeName: "프리미엄",
  projectType: "전체 리모델링",
  categories: [
    {
      id: "c1",
      name: "철거공사",
      grade: "표준",
      gradeKey: "std",
      amount: 1_000_000,
      lineItems: [
        { name: "철거 인건비", qty: 2, unit: "일", amount: 1_000_000 },
      ],
    },
  ],
  subtotal: 1_000_000,
  profitRate: 10,
  profitAmount: 100_000,
  overheadRate: 5,
  overheadAmount: 50_000,
  vatOn: true,
  vatAmount: 115_000,
  grandTotal: 1_265_000,
  companyInfo: {
    companyName: "저스트인타임 인테리어",
    representative: "대표",
    companyAddress: "서울시 강남구",
    companyPhone: "02-1234-5678",
    businessNumber: "123-45-67890",
  },
  notes: "빠른 시공 요청",
};

describe("estimateBuilderSchema", () => {
  it("정상 입력을 통과시킨다", () => {
    const result = estimateBuilderSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("title이 빈 문자열이면 거부한다", () => {
    const result = estimateBuilderSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
  });

  it("title이 없으면 거부한다", () => {
    const { title: _title, ...rest } = validInput;
    void _title;
    const result = estimateBuilderSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("title/클라이언트명 XSS payload를 정제한다", () => {
    const result = estimateBuilderSchema.safeParse({
      ...validInput,
      title: '<script>alert(1)</script>강남 리모델링',
      clientName: "<b>홍길동</b>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).not.toContain("<script");
      expect(result.data.title).toContain("강남 리모델링");
      expect(result.data.clientName).toBe("홍길동");
    }
  });

  it("카테고리 항목명 XSS payload를 정제한다", () => {
    const result = estimateBuilderSchema.safeParse({
      ...validInput,
      categories: [
        {
          id: "c1",
          name: '<img onerror=hack>철거',
          grade: "",
          gradeKey: "",
          amount: 0,
          lineItems: [
            { name: "<script>steal()</script>인건비", qty: 1, unit: "일", amount: 100_000 },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categories[0].name).not.toContain("<img");
      expect(result.data.categories[0].name).toContain("철거");
      expect(result.data.categories[0].lineItems[0].name).not.toContain("<script");
      expect(result.data.categories[0].lineItems[0].name).toContain("인건비");
    }
  });

  it("profitRate 0~100 범위만 허용한다", () => {
    expect(estimateBuilderSchema.safeParse({ ...validInput, profitRate: 101 }).success).toBe(false);
    expect(estimateBuilderSchema.safeParse({ ...validInput, profitRate: -1 }).success).toBe(false);
    expect(estimateBuilderSchema.safeParse({ ...validInput, profitRate: 0 }).success).toBe(true);
    expect(estimateBuilderSchema.safeParse({ ...validInput, profitRate: 100 }).success).toBe(true);
  });

  it("overheadRate 0~100 범위만 허용한다", () => {
    expect(estimateBuilderSchema.safeParse({ ...validInput, overheadRate: 150 }).success).toBe(false);
  });

  it("areaPyeong을 문자열로 받아도 숫자로 변환한다", () => {
    const result = estimateBuilderSchema.safeParse({ ...validInput, areaPyeong: "42.5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.areaPyeong).toBe(42.5);
    }
  });

  it("areaPyeong이 빈 문자열이면 0으로 기본 처리한다", () => {
    const result = estimateBuilderSchema.safeParse({ ...validInput, areaPyeong: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.areaPyeong).toBe(0);
    }
  });

  it("음수 금액은 거부한다", () => {
    expect(estimateBuilderSchema.safeParse({ ...validInput, grandTotal: -1 }).success).toBe(false);
    expect(estimateBuilderSchema.safeParse({ ...validInput, subtotal: -1 }).success).toBe(false);
  });

  it("grade 문자열 자체는 허용한다 (enum 제약 없음)", () => {
    const result = estimateBuilderSchema.safeParse({
      ...validInput,
      categories: [
        {
          id: "c1",
          name: "목공",
          grade: "커스텀등급",
          gradeKey: "custom",
          amount: 0,
          lineItems: [],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("optional 필드가 없어도 파싱된다", () => {
    const minimal = {
      title: "최소 견적",
      categories: [],
    };
    const result = estimateBuilderSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("최소 견적");
      expect(result.data.profitRate).toBe(0);
      expect(result.data.vatOn).toBe(false);
    }
  });
});
