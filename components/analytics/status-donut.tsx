"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["var(--viz-blue)", "var(--viz-orange)", "var(--viz-good)"];

export function StatusDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No tasks yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          strokeWidth={2}
          stroke="var(--card)"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => {
            const v = Number(value) || 0;
            return [`${v} (${Math.round((v / total) * 100)}%)`, name] as [string, string];
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={28}
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
