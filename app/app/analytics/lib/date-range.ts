export type AnalyticsPresetRange = "7d" | "14d" | "30d" | "90d";
export type AnalyticsRange = AnalyticsPresetRange | "custom";

export type AnalyticsSearchParams = {
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

type AnalyticsPresetOption = {
  value: AnalyticsPresetRange;
  days: number;
  shortLabel: string;
  label: string;
};

export type AnalyticsResolvedDateRange = {
  value: AnalyticsRange;
  days: number;
  from: Date;
  to: Date;
  fromKey: string;
  toKey: string;
  label: string;
  cardLabel: string;
  comparisonLabel: string;
  filterLabel: string;
  isCustom: boolean;
};

export const DEFAULT_ANALYTICS_RANGE: AnalyticsPresetRange = "14d";

export const ANALYTICS_RANGE_OPTIONS = [
  { value: "7d", days: 7, shortLabel: "7D", label: "Last 7 days" },
  { value: "14d", days: 14, shortLabel: "14D", label: "Last 14 days" },
  { value: "30d", days: 30, shortLabel: "30D", label: "Last 30 days" },
  { value: "90d", days: 90, shortLabel: "90D", label: "Last 90 days" },
] as const satisfies readonly AnalyticsPresetOption[];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getFirstValue(value: string | string[] | null | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function formatAnalyticsDayKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseAnalyticsDayKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  return formatAnalyticsDayKey(date) === value ? date : null;
}

export function startOfUtcDay(date: Date): Date {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

export function addUtcDays(date: Date, days: number): Date {
  const next = startOfUtcDay(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function buildAnalyticsDayKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const start = startOfUtcDay(from);
  const end = startOfUtcDay(to);

  for (let current = new Date(start); current <= end; current = addUtcDays(current, 1)) {
    keys.push(formatAnalyticsDayKey(current));
  }

  return keys;
}

export function formatAnalyticsDayLabel(value: string | Date): string {
  const date = typeof value === "string" ? parseAnalyticsDayKey(value) : value;
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatAnalyticsDateRangeLabel(from: Date, to: Date): string {
  const fromLabel = formatAnalyticsDayLabel(from);
  const toLabel = formatAnalyticsDayLabel(to);
  return fromLabel === toLabel ? fromLabel : `${fromLabel} - ${toLabel}`;
}

function getPresetOption(range: AnalyticsPresetRange) {
  return (
    ANALYTICS_RANGE_OPTIONS.find((option) => option.value === range) ??
    ANALYTICS_RANGE_OPTIONS.find(
      (option) => option.value === DEFAULT_ANALYTICS_RANGE,
    )!
  );
}

function getPresetDateRange(
  option: AnalyticsPresetOption,
  today: Date,
): AnalyticsResolvedDateRange {
  const to = today;
  const from = addUtcDays(today, -(option.days - 1));

  return {
    value: option.value,
    days: option.days,
    from,
    to,
    fromKey: formatAnalyticsDayKey(from),
    toKey: formatAnalyticsDayKey(to),
    label: formatAnalyticsDateRangeLabel(from, to),
    cardLabel: option.label.toLowerCase(),
    comparisonLabel: `previous ${option.days} days`,
    filterLabel: option.label,
    isCustom: false,
  };
}

function getCustomDateRange(
  from: Date,
  to: Date,
  today: Date,
): AnalyticsResolvedDateRange {
  const normalizedFrom = startOfUtcDay(from);
  const normalizedTo = startOfUtcDay(to);

  const orderedStart =
    normalizedFrom <= normalizedTo ? normalizedFrom : normalizedTo;
  const orderedEnd = normalizedFrom <= normalizedTo ? normalizedTo : normalizedFrom;
  const clampedEnd = orderedEnd > today ? today : orderedEnd;
  const clampedStart = orderedStart > today ? today : orderedStart;
  const safeStart = clampedStart <= clampedEnd ? clampedStart : clampedEnd;
  const days =
    Math.floor((clampedEnd.getTime() - safeStart.getTime()) / DAY_IN_MS) + 1;
  const label = formatAnalyticsDateRangeLabel(safeStart, clampedEnd);

  return {
    value: "custom",
    days,
    from: safeStart,
    to: clampedEnd,
    fromKey: formatAnalyticsDayKey(safeStart),
    toKey: formatAnalyticsDayKey(clampedEnd),
    label,
    cardLabel: label,
    comparisonLabel: `previous ${days} ${days === 1 ? "day" : "days"}`,
    filterLabel: label,
    isCustom: true,
  };
}

export function resolveAnalyticsDateRange(
  searchParams?: AnalyticsSearchParams,
  now = new Date(),
): AnalyticsResolvedDateRange {
  const today = startOfUtcDay(now);
  const range = getFirstValue(searchParams?.range);

  if (range === "custom") {
    const from = parseAnalyticsDayKey(getFirstValue(searchParams?.from) ?? "");
    const to = parseAnalyticsDayKey(getFirstValue(searchParams?.to) ?? "");

    if (from && to) {
      return getCustomDateRange(from, to, today);
    }
  }

  const presetRange = ANALYTICS_RANGE_OPTIONS.find(
    (option) => option.value === range,
  )?.value;

  return getPresetDateRange(
    getPresetOption(presetRange ?? DEFAULT_ANALYTICS_RANGE),
    today,
  );
}
