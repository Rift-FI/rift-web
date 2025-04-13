"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
  { month: "January", desktop: 0, mobile: 0 },
  { month: "February", desktop: 0, mobile: 0 },
  { month: "March", desktop: 0, mobile: 0 },
  { month: "April", desktop: 0, mobile: 0 },
  { month: "May", desktop: 0, mobile: 0 },
  { month: "June", desktop: 0, mobile: 0 },
];

const chartConfig = {
  desktop: {
    label: "Earnings",
    color: "#32e15e",
  },
  mobile: {
    label: "Spending",
    color: "#f41818",
  },
} satisfies ChartConfig;

export function ActivityChart() {
  return (
    <Card className="bg-[#212121] w-full">
      <CardHeader>
        <CardTitle className="text-[#f6f7f9]">My Activity</CardTitle>
        <CardDescription className="text-gray-400">
          Since January 2025
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-gray-400 text-[10px]">
          No activity recorded yet.
        </div>
      </CardFooter>
    </Card>
  );
}
