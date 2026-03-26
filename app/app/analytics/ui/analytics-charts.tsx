"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";
import { Minus, Plus, RotateCcw } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

type AnalyticsSeriesPoint = {
  day: string;
  created: number;
  opened: number;
};

type Viewport = {
  startIndex: number;
  endIndex: number;
};

const MIN_VISIBLE_POINTS = 7;
const ZOOM_STEP = 0.7;

function formatDayTick(value: string) {
  return String(value).slice(5);
}

function getActiveTooltipIndex(state: unknown): number | null {
  if (typeof state !== "object" || state === null) return null;

  const index = (state as { activeTooltipIndex?: unknown }).activeTooltipIndex;
  return typeof index === "number" ? index : null;
}

function clampViewport(
  viewport: Viewport | null,
  totalPoints: number,
): Viewport | null {
  if (!viewport || totalPoints <= 0) return null;

  const startIndex = Math.max(0, Math.min(viewport.startIndex, totalPoints - 1));
  const endIndex = Math.max(startIndex, Math.min(viewport.endIndex, totalPoints - 1));

  if (startIndex === 0 && endIndex === totalPoints - 1) {
    return null;
  }

  return { startIndex, endIndex };
}

function getZoomedViewport(
  current: Viewport,
  totalPoints: number,
  nextVisiblePoints: number,
): Viewport | null {
  if (totalPoints <= 0) return null;

  const clampedVisiblePoints = Math.max(
    MIN_VISIBLE_POINTS,
    Math.min(totalPoints, nextVisiblePoints),
  );

  if (clampedVisiblePoints >= totalPoints) return null;

  const center = Math.floor((current.startIndex + current.endIndex) / 2);
  const halfWindow = Math.floor((clampedVisiblePoints - 1) / 2);

  let startIndex = center - halfWindow;
  let endIndex = startIndex + clampedVisiblePoints - 1;

  if (startIndex < 0) {
    startIndex = 0;
    endIndex = clampedVisiblePoints - 1;
  }

  if (endIndex >= totalPoints) {
    endIndex = totalPoints - 1;
    startIndex = endIndex - clampedVisiblePoints + 1;
  }

  return { startIndex, endIndex };
}

export function AnalyticsCharts({
  series,
}: {
  series: AnalyticsSeriesPoint[];
}) {
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const resolvedViewport = useMemo(() => {
    if (series.length === 0) return null;

    return (
      clampViewport(viewport, series.length) ?? {
        startIndex: 0,
        endIndex: series.length - 1,
      }
    );
  }, [series.length, viewport]);

  const viewSeries = useMemo(() => {
    if (!resolvedViewport) return [];

    return series.slice(
      resolvedViewport.startIndex,
      resolvedViewport.endIndex + 1,
    );
  }, [resolvedViewport, series]);

  const visiblePoints = viewSeries.length;
  const isZoomed = resolvedViewport
    ? resolvedViewport.startIndex > 0 ||
      resolvedViewport.endIndex < series.length - 1
    : false;
  const canZoomIn = visiblePoints > MIN_VISIBLE_POINTS;
  const canZoomOut = isZoomed;
  const isDragging = selectionStart !== null;

  const selectionRange = useMemo(() => {
    if (selectionStart == null || selectionEnd == null || !resolvedViewport) {
      return null;
    }

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);

    if (start === end) return null;

    return {
      start,
      end,
      from: viewSeries[start]?.day,
      to: viewSeries[end]?.day,
      absoluteStart: resolvedViewport.startIndex + start,
      absoluteEnd: resolvedViewport.startIndex + end,
    };
  }, [resolvedViewport, selectionEnd, selectionStart, viewSeries]);

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const resetZoom = () => {
    setViewport(null);
    clearSelection();
  };

  const zoomIn = () => {
    if (!resolvedViewport) return;

    const nextVisiblePoints = Math.floor(visiblePoints * ZOOM_STEP);
    const nextViewport = getZoomedViewport(
      resolvedViewport,
      series.length,
      nextVisiblePoints,
    );

    if (nextViewport) {
      setViewport(nextViewport);
    }
  };

  const zoomOut = () => {
    if (!resolvedViewport) return;

    const nextVisiblePoints = Math.ceil(visiblePoints / ZOOM_STEP);
    const nextViewport = getZoomedViewport(
      resolvedViewport,
      series.length,
      nextVisiblePoints,
    );

    setViewport(nextViewport);
  };

  const startSelection = (state: unknown) => {
    const index = getActiveTooltipIndex(state);
    if (index == null) return;

    setSelectionStart(index);
    setSelectionEnd(index);
  };

  const updateSelection = (state: unknown) => {
    if (selectionStart == null) return;

    const index = getActiveTooltipIndex(state);
    if (index == null) return;

    setSelectionEnd(index);
  };

  const applyZoom = () => {
    if (!selectionRange) {
      clearSelection();
      return;
    }

    setViewport({
      startIndex: selectionRange.absoluteStart,
      endIndex: selectionRange.absoluteEnd,
    });
    clearSelection();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Drag across the chart to zoom into a time window, or use the controls
          for precise zoom steps.
        </p>

        <ButtonGroup>
          <ButtonGroupText>Zoom</ButtonGroupText>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={!canZoomOut}
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={!canZoomIn}
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            disabled={!isZoomed}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </ButtonGroup>
      </div>

      <div className="relative">
        <ChartContainer
          data-dragging={isDragging}
          className={cn(
            "h-96 w-full select-none rounded-none border bg-background/30",
            "cursor-crosshair data-[dragging=true]:cursor-ew-resize",
          )}
          config={{
            created: { label: "Created", color: "hsl(var(--primary))" },
            opened: { label: "Opened", color: "hsl(var(--muted-foreground))" },
          }}
        >
          <BarChart
            data={viewSeries}
            margin={{ left: 12, right: 12, top: 12, bottom: 8 }}
            onMouseDown={startSelection}
            onMouseMove={updateSelection}
            onMouseUp={applyZoom}
            onMouseLeave={clearSelection}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={formatDayTick}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
              domain={[0, "dataMax + 1"]}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            <Bar
              dataKey="created"
              fill="var(--chart-2)"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="opened"
              fill="var(--chart-1)"
              radius={[6, 6, 0, 0]}
            />

            {selectionRange?.from && selectionRange?.to ? (
              <ReferenceArea
                x1={selectionRange.from}
                x2={selectionRange.to}
                fill="hsl(var(--primary))"
                fillOpacity={0.12}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.35}
              />
            ) : null}
          </BarChart>
        </ChartContainer>

        <div className="pointer-events-none absolute right-3 top-3">
          <div className="rounded-none border bg-background/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
            {isDragging
              ? "Release to zoom"
              : isZoomed
                ? "Drag to zoom deeper"
                : "Drag to zoom"}
          </div>
        </div>
      </div>
    </div>
  );
}
