import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { colors } from "@/constants";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IHistoricalPrice } from "../mock/tokenDetailsMockData";

const chartConfig = {
  token: {
    label: "Token Price",
    color: colors.accent,
  },
} as const;

type ChartKey = keyof typeof chartConfig;

export function PriceChart({
  historicalPrice,
}: {
  historicalPrice: IHistoricalPrice[];
}) {
  const activeChart: ChartKey = "token";
  const [activeRange, setActiveRange] = useState<
    "1D" | "1W" | "1M" | "1Y" | "YTD" | "ALL"
  >("1M");

  function filterChartData(
    data: IHistoricalPrice[],
    range: typeof activeRange
  ) {
    const now = new Date(data[data.length - 1].date);
    switch (range) {
      case "1D":
        return [data[data.length - 1]];
      case "1W":
        return data.slice(-7);
      case "1M":
        return data.slice(-30);
      case "1Y":
        return data.filter(
          (d) => new Date(d.date).getFullYear() === now.getFullYear()
        );
      case "YTD":
        return data.filter(
          (d) => new Date(d.date).getFullYear() === now.getFullYear()
        );
      case "ALL":
      default:
        return data;
    }
  }

  if (!historicalPrice) {
    return <div>Loading...</div>;
  }
  const chartData = historicalPrice;

  return (
    <Card className="shadow-none border-none bg-transparent">
      <CardContent className="px-1 sm:p-2">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={filterChartData(chartData, activeRange)}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              hide
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="token"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={chartConfig[activeChart].color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            onClick={() => setActiveRange("1D")}
            className={cn(activeRange === "1D" && "bg-accent")}
          >
            1D
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveRange("1W")}
            className={cn(activeRange === "1W" && "bg-accent")}
          >
            1W
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveRange("1M")}
            className={cn(activeRange === "1M" && "bg-accent")}
          >
            1M
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveRange("1Y")}
            className={cn(activeRange === "1Y" && "bg-accent")}
          >
            1Y
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveRange("YTD")}
            className={cn(activeRange === "YTD" && "bg-accent")}
          >
            YTD
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
