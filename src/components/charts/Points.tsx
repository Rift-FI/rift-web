import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
const chartData = [
  { category: "Rewards", points: 275, fill: "#ffd700" },
  { category: "Bonuses", points: 200, fill: "#2656ed" },
  { category: "Loyalty Points", points: 287, fill: "#fe4a22" },
  { category: "Referrals", points: 173, fill: "#4a90a9" },
  { category: "Other", points: 190, fill: "#000" },
];

const chartConfig = {
  points: {
    label: "Points Distribution",
  },
  chrome: {
    label: "Rewards",
    color: "#FFD700",
  },
  safari: {
    label: "Bonuses",
    color: "#2656ed",
  },
  firefox: {
    label: "Loyalty Points",
    color: "#fe4a22",
  },
  edge: {
    label: "Referrals",
    color: "#4A90A9#",
  },
  other: {
    label: "Other",
    color: "#000",
  },
} satisfies ChartConfig;

export function PointsChart() {
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.points, 0);
  }, []);

  return (
    <Card className="flex flex-col border-none">
      <CardHeader className="items-center pb-0">
        <CardDescription className="font-body font-semibold text-gray-400">
          Points Distribution in 2025
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="points"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                          style={{
                            color: "#fff",
                            fill: "#fff",
                          }}
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground font-semibold font-body"
                          style={{
                            color: "#fff",
                            fill: "#fff",
                          }}
                        >
                          Points
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter> */}
    </Card>
  );
}
