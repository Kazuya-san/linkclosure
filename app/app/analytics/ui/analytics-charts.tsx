"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export function AnalyticsCharts(props: {
  series: Array<{ day: string; created: number; opened: number }>;
}) {
  return (
    <ChartContainer
      className="h-80 w-full"
      config={{
        created: { label: "Created", color: "hsl(var(--primary))" },
        opened: { label: "Opened", color: "hsl(var(--muted-foreground))" },
      }}
    >
      <BarChart data={props.series} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />

        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          // optional: show MM-DD instead of YYYY-MM-DD
          tickFormatter={(v) => String(v).slice(5)}
        />

        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
          domain={[0, "dataMax + 1"]}
        />

        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

        <Bar dataKey="created" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="opened" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
