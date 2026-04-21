import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// We test the ProgressRing component which is pure UI (no API calls)
describe("ProgressRing", () => {
  it("renders with 0 progress", async () => {
    const { ProgressRing } = await import("@/components/portal/ProgressRing");
    const { container } = render(<ProgressRing progress={0} size={120} />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
  });

  it("renders with 75 progress", async () => {
    const { ProgressRing } = await import("@/components/portal/ProgressRing");
    render(<ProgressRing progress={75} size={120} />);
    expect(screen.getByText("75%")).toBeTruthy();
  });

  it("clamps progress above 100", async () => {
    const { ProgressRing } = await import("@/components/portal/ProgressRing");
    render(<ProgressRing progress={150} size={120} />);
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("clamps negative progress to 0", async () => {
    const { ProgressRing } = await import("@/components/portal/ProgressRing");
    render(<ProgressRing progress={-5} size={120} />);
    expect(screen.getByText("0%")).toBeTruthy();
  });
});

describe("PhaseTimeline", () => {
  it("renders phases", async () => {
    const { PhaseTimeline } = await import("@/components/portal/PhaseTimeline");
    const phases = [
      {
        id: "1",
        category: "철거",
        status: "완료" as const,
        progress: 100,
        plannedStart: "2026-04-01",
        plannedEnd: "2026-04-05",
        actualStart: "2026-04-01",
        actualEnd: "2026-04-04",
        sortOrder: 0,
        memo: null,
      },
      {
        id: "2",
        category: "목공",
        status: "진행중" as const,
        progress: 45,
        plannedStart: "2026-04-06",
        plannedEnd: "2026-04-15",
        actualStart: "2026-04-06",
        actualEnd: null,
        sortOrder: 1,
        memo: null,
      },
    ];
    render(<PhaseTimeline phases={phases} />);
    expect(screen.getByText("철거")).toBeTruthy();
    expect(screen.getByText("목공")).toBeTruthy();
    expect(screen.getByText("완료")).toBeTruthy();
    expect(screen.getByText("진행중")).toBeTruthy();
  });

  it("renders empty state", async () => {
    const { PhaseTimeline } = await import("@/components/portal/PhaseTimeline");
    render(<PhaseTimeline phases={[]} />);
    expect(screen.getByText("등록된 공정이 없습니다.")).toBeTruthy();
  });
});

describe("PaymentTimeline", () => {
  it("renders payment milestones", async () => {
    const { PaymentTimeline } = await import("@/components/portal/PaymentTimeline");
    const payments = [
      {
        id: "1",
        milestoneName: "계약금",
        amount: 5000000,
        taxAmount: 500000,
        status: "paid" as const,
        dueDate: "2026-04-01",
        paidAt: "2026-04-01T09:00:00Z",
        milestoneOrder: 0,
      },
      {
        id: "2",
        milestoneName: "중도금",
        amount: 30000000,
        taxAmount: 3000000,
        status: "pending" as const,
        dueDate: "2026-04-25",
        paidAt: null,
        milestoneOrder: 1,
      },
    ];
    render(<PaymentTimeline payments={payments} />);
    expect(screen.getByText("계약금")).toBeTruthy();
    expect(screen.getByText("중도금")).toBeTruthy();
  });

  it("renders empty state", async () => {
    const { PaymentTimeline } = await import("@/components/portal/PaymentTimeline");
    render(<PaymentTimeline payments={[]} />);
    expect(screen.getByText("등록된 수금 일정이 없습니다.")).toBeTruthy();
  });
});

describe("ChangeRequestForm", () => {
  it("renders form with category options", async () => {
    const { ChangeRequestForm } = await import("@/components/portal/ChangeRequestForm");
    const noop = async () => {};
    render(<ChangeRequestForm onSubmit={noop} />);
    // Check that category options are rendered
    expect(screen.getByText("디자인 변경")).toBeTruthy();
  });
});
