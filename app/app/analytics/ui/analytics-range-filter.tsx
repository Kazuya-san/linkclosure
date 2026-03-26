"use client";

import { useEffect, useState, useTransition } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ANALYTICS_RANGE_OPTIONS,
  DEFAULT_ANALYTICS_RANGE,
  formatAnalyticsDayLabel,
  formatAnalyticsDayKey,
  parseAnalyticsDayKey,
  startOfUtcDay,
  type AnalyticsPresetRange,
  type AnalyticsRange,
} from "../lib/date-range";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function getDateRange(fromKey: string, toKey: string): DateRange | undefined {
  const from = parseAnalyticsDayKey(fromKey);
  const to = parseAnalyticsDayKey(toKey);

  if (!from || !to) return undefined;

  return { from, to };
}

function isPresetRange(value: string): value is AnalyticsPresetRange {
  return ANALYTICS_RANGE_OPTIONS.some((option) => option.value === value);
}

export function AnalyticsRangeFilter({
  value,
  fromKey,
  toKey,
  customLabel,
}: {
  value: AnalyticsRange;
  fromKey: string;
  toKey: string;
  customLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    getDateRange(fromKey, toKey),
  );

  useEffect(() => {
    setDraftRange(getDateRange(fromKey, toKey));
  }, [fromKey, toKey]);

  const updateUrl = (nextRange: AnalyticsRange, nextFrom?: string, nextTo?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextRange === DEFAULT_ANALYTICS_RANGE) {
      params.delete("range");
    } else {
      params.set("range", nextRange);
    }

    if (nextRange === "custom" && nextFrom && nextTo) {
      params.set("from", nextFrom);
      params.set("to", nextTo);
    } else {
      params.delete("from");
      params.delete("to");
    }

    const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  const handlePresetChange = (nextValue: string) => {
    if (!isPresetRange(nextValue)) return;
    if (value === nextValue) return;
    updateUrl(nextValue);
  };

  const handleMobileRangeChange = (nextValue: string) => {
    if (nextValue === "custom") {
      setIsCustomOpen(true);
      return;
    }

    handlePresetChange(nextValue);
  };

  const handleApplyCustomRange = () => {
    const from = draftRange?.from ? startOfUtcDay(draftRange.from) : null;
    const to = draftRange?.to ? startOfUtcDay(draftRange.to) : null;

    if (!from || !to) return;

    updateUrl("custom", formatAnalyticsDayKey(from), formatAnalyticsDayKey(to));
    setIsCustomOpen(false);
  };

  const customButtonLabel =
    value === "custom" ? customLabel : "Custom";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="sm:hidden">
        <Select
          value={value}
          onValueChange={handleMobileRangeChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full min-w-36">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent align="end">
            {ANALYTICS_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden sm:flex">
        <ButtonGroup>
          <ButtonGroupText>
            <CalendarDays className="h-3.5 w-3.5" />
            Range
          </ButtonGroupText>

          <ToggleGroup
            type="single"
            value={isPresetRange(value) ? value : ""}
            onValueChange={handlePresetChange}
            variant="outline"
            size="sm"
            disabled={isPending}
          >
            {ANALYTICS_RANGE_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                aria-label={option.label}
              >
                {option.shortLabel}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ButtonGroup>
      </div>

      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={value === "custom" ? "secondary" : "outline"}
            size="sm"
            disabled={isPending}
            className="justify-start sm:min-w-32"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {customButtonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <div className="p-3">
            <PopoverHeader className="px-1 pb-2">
              <PopoverTitle>Custom range</PopoverTitle>
              <PopoverDescription>
                Compare any date window against the previous period.
              </PopoverDescription>
            </PopoverHeader>

            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              defaultMonth={draftRange?.from}
              disabled={(date) => startOfUtcDay(date) > startOfUtcDay(new Date())}
              numberOfMonths={2}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-1 pt-3">
              <div className="text-xs text-muted-foreground">
                {draftRange?.from && draftRange?.to
                  ? `${formatAnalyticsDayLabel(draftRange.from)} - ${formatAnalyticsDayLabel(draftRange.to)}`
                  : "Pick a start and end date"}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraftRange(getDateRange(fromKey, toKey));
                    setIsCustomOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCustomRange}
                  disabled={!draftRange?.from || !draftRange?.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
