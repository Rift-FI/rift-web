import React, { useState, useMemo, useCallback } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { CandlestickData } from "lightweight-charts";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { colors } from "@/constants";
import { cn } from "@/lib/utils";
import { useTokenHistoricalData } from "@/hooks/token/useTokenHistoricalData";

interface PriceChartProps {
  readonly tokenID: string;
}

type TimeRange = "1D" | "1W" | "1M" | "1Y" | "YTD" | "ALL";

interface ChartConfig {
  readonly [key: string]: {
    readonly label: string;
    readonly color: string;
  };
}

interface TimeRangeButton {
  readonly range: TimeRange;
  readonly label: string;
}

interface TooltipData {
  readonly time: number;
  readonly close: number;
}

interface ChartTooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{ payload: TooltipData }>;
  readonly label?: string;
}

// Constants
const CHART_CONFIG: ChartConfig = {
  close: {
    label: "Close Price",
    color: colors.accent,
  },
} as const;

const DAYS_RANGE_MAPPING: Record<TimeRange, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "1Y": 365,
  YTD: 365,
  ALL: 10000,
} as const;

const TIME_RANGE_BUTTONS: TimeRangeButton[] = [
  { range: "1D", label: "1D" },
  { range: "1W", label: "1W" },
  { range: "1M", label: "1M" },
  { range: "1Y", label: "1Y" },
  { range: "YTD", label: "YTD" },
] as const;

const DEFAULT_RANGE: TimeRange = "1M";

const CHART_MARGINS = {
  left: 12,
  right: 12,
} as const;

const filterChartData = (
  data: CandlestickData[],
  range: TimeRange
): CandlestickData[] => {
  if (data.length === 0) return [];

  const now = new Date(data[data.length - 1].time as number);

  switch (range) {
    case "1D":
      return [data[data.length - 1]];
    case "1W":
      return data.slice(-7);
    case "1M":
      return data.slice(-30);
    case "1Y":
    case "YTD":
      return data.filter(
        (d) => new Date(d.time as number).getFullYear() === now.getFullYear()
      );
    case "ALL":
    default:
      return data;
  }
};

const formatDateForAxis = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatDateForTooltip = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const LoadingState: React.FC = React.memo(() => (
  <div className="flex justify-center items-center bg-accent p-4 mx-2 animate-pulse h-[350px] mb-4 rounded-xl">
    <span className="sr-only">Loading chart data...</span>
  </div>
));

const ErrorState: React.FC<{ error: string }> = React.memo(({ error }) => (
  <div className="flex bg-accent rounded-xl p-4 mx-2">
    <div className="flex flex-col gap-1">
      <p className="text-danger text-sm" role="alert">
        Error loading data
      </p>
      <p className="text-danger text-xs">{error}</p>
    </div>
  </div>
));

const EmptyState: React.FC = React.memo(() => (
  <div className="flex justify-center items-center bg-accent p-4 mx-2 h-[350px] mb-4 rounded-xl">
    <p className="text-sm">No data available</p>
  </div>
));

const CustomTooltip: React.FC<ChartTooltipProps> = React.memo(
  ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const data = payload[0].payload;

    return (
      <div className="rounded-lg border border-text-subtle bg-app-background p-2 shadow-sm">
        <div className="text-xs font-medium">
          {formatDateForTooltip(data.time)}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <div className="w-3 h-3 rounded-xs bg-accent-secondary" />
          Close: ${data.close.toLocaleString()}
        </div>
      </div>
    );
  }
);

const TimeRangeSelector: React.FC<{
  activeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}> = React.memo(({ activeRange, onRangeChange }) => (
  <div className="flex items-center justify-between w-full">
    {TIME_RANGE_BUTTONS.map(({ range, label }) => (
      <Button
        key={range}
        variant="ghost"
        onClick={() => onRangeChange(range)}
        className={cn(activeRange === range && "bg-accent")}
        aria-pressed={activeRange === range}
      >
        {label}
      </Button>
    ))}
  </div>
));

const PriceLineChart: React.FC<{
  data: CandlestickData[];
}> = React.memo(({ data }) => (
  <ChartContainer
    config={CHART_CONFIG}
    className="aspect-auto h-[300px] w-full"
  >
    <LineChart accessibilityLayer data={data} margin={CHART_MARGINS}>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="time"
        tickLine={false}
        hide
        axisLine={false}
        tickMargin={8}
        minTickGap={32}
        tickFormatter={formatDateForAxis}
      />
      <ChartTooltip content={<CustomTooltip />} />
      <Line
        dataKey="close"
        type="monotone"
        stroke={CHART_CONFIG.close.color}
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ChartContainer>
));

// Custom hook for range management
const useTimeRange = (initialRange: TimeRange = DEFAULT_RANGE) => {
  const [activeRange, setActiveRange] = useState<TimeRange>(initialRange);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setActiveRange(range);
  }, []);

  const daysForRange = useMemo(
    () => DAYS_RANGE_MAPPING[activeRange],
    [activeRange]
  );

  return {
    activeRange,
    daysForRange,
    handleRangeChange,
  };
};

export const PriceChart: React.FC<PriceChartProps> = ({ tokenID }) => {
  const { activeRange, daysForRange, handleRangeChange } = useTimeRange();

  const { historicalData, isLoadingHistoricalData, errorHistoricalData } =
    useTokenHistoricalData(tokenID, daysForRange);

  const filteredData = useMemo(() => {
    if (!historicalData) return [];
    return filterChartData(historicalData, activeRange);
  }, [historicalData, activeRange]);

  if (isLoadingHistoricalData) {
    return <LoadingState />;
  }

  if (errorHistoricalData) {
    return (
      <ErrorState
        error={errorHistoricalData.message || "Unknown error occurred"}
      />
    );
  }

  if (!historicalData || historicalData.length === 0) {
    return <EmptyState />;
  }

  return (
    <Card className="shadow-none border-none bg-transparent">
      <CardContent className="sm:p-2">
        <PriceLineChart data={filteredData} />
      </CardContent>
      <CardFooter>
        <TimeRangeSelector
          activeRange={activeRange}
          onRangeChange={handleRangeChange}
        />
      </CardFooter>
    </Card>
  );
};

LoadingState.displayName = "PriceChart.LoadingState";
ErrorState.displayName = "PriceChart.ErrorState";
EmptyState.displayName = "PriceChart.EmptyState";
CustomTooltip.displayName = "PriceChart.CustomTooltip";
TimeRangeSelector.displayName = "PriceChart.TimeRangeSelector";
PriceLineChart.displayName = "PriceChart.PriceLineChart";
PriceChart.displayName = "PriceChart";
