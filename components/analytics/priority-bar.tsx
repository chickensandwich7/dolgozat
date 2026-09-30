"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid } from "recharts";

const PRIORITY_COLORS: Record<string, string> = {
  Low: "var(--viz-good)",
  Medium: "var(--viz-warning)",
  High: "var(--viz-critical)",
};

export function PriorityBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "var(--accent)" }}
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((d) => (
            <Cell key={d.name} fill={PRIORITY_COLORS[d.name] || "var(--viz-blue)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
