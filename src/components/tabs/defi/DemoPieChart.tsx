"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
const chartData = [
  { browser: "chrome", visitors: 275, fill: "#000" },
  { browser: "safari", visitors: 200, fill: "#32e15e" },
  { browser: "firefox", visitors: 287, fill: "#ffb386" },
  { browser: "edge", visitors: 173, fill: "#f41818" },
  { browser: "other", visitors: 190, fill: "#494949" },
];

const chartConfig = {
  visitors: {
    label: "Investment",
  },
  chrome: {
    label: "AAVE",
    color: "#000",
  },
  safari: {
    label: "Compound Finance",
    color: "#32e15e",
  },
  firefox: {
    label: "Lido Staking",
    color: "#ffb386",
  },
  edge: {
    label: "Quvault",
    color: "#f41818",
  },
  other: {
    label: "Other",
    color: "#494949",
  },
} satisfies ChartConfig;

export function DemoPieChart() {
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, []);

  return (
    <Card className="flex flex-col bg-[#212121] mb-2 w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-[#f6f7f9]">Investment Chart</CardTitle>
        <CardDescription className="text-gray-400">
          January - June 2024
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
              dataKey="visitors"
              nameKey="browser"
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
                          className="fill-[#f6f7f9] text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-gray-400 text-xs"
                        >
                          USD
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
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex text-sm items-center gap-2 font-medium leading-none text-gray-400">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground text-[10px]">
          Showing total investment for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
