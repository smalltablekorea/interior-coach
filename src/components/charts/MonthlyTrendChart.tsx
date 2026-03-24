"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendData {
  month: string;
  revenue: number;
  expense: number;
}

export default function MonthlyTrendChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={2}>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          tickFormatter={(v: number) =>
            v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${v}`
          }
          width={45}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontSize: "12px",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            `${(Number(value) / 10000).toFixed(0)}만원`,
            name === "revenue" ? "수금" : "지출",
          ]}
        />
        <Bar dataKey="revenue" fill="var(--green)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="var(--orange)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
