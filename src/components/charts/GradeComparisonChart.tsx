"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtShort } from "@/lib/utils";

interface GradeData {
  name: string;
  key: string;
  total: number;
  color: string;
  tag: string;
  fill: string;
  fillOpacity: number;
}

interface GradeComparisonChartProps {
  data: GradeData[];
  selectedGradeTotal: number;
  onBarClick: (key: string) => void;
}

export default function GradeComparisonChart({
  data,
  selectedGradeTotal,
  onBarClick,
}: GradeComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={1}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={(state: any) => {
          const key = state?.activePayload?.[0]?.payload?.key;
          if (key) onBarClick(key);
        }}
      >
        <XAxis
          dataKey="name"
          tick={{ fill: "#888", fontSize: 12 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => fmtShort(v)}
          tick={{ fill: "#888", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <RechartsTooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "12px",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _name: any, props: any) => {
            const v = Number(value) || 0;
            const diff = v - selectedGradeTotal;
            const diffLabel = diff === 0 ? "(현재 선택)" : diff > 0 ? `+${fmtShort(diff)}` : fmtShort(diff);
            return [`${fmtShort(v)} ${diffLabel}`, `${props?.payload?.tag || ""}`];
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(label: any) => `${label} 등급`}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} cursor="pointer" />
      </BarChart>
    </ResponsiveContainer>
  );
}
