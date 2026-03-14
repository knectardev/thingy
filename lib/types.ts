export interface LogEntry {
  id: number;
  thingy_id: number;
  action: string;
  status: string;
  timestamp: string;
  content: string;
  token: string | null;
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.345, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function timeAgo(isoString: string): string {
  // Postgres TIMESTAMP (without tz) returns values in UTC but without a Z suffix.
  // Append Z so JS Date parses it as UTC rather than local time.
  const normalized = isoString.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(isoString)
    ? isoString
    : isoString + "Z";
  let seconds = (new Date(normalized).getTime() - Date.now()) / 1000;

  for (const { amount, unit } of TIME_DIVISIONS) {
    if (Math.abs(seconds) < amount) {
      return rtf.format(Math.round(seconds), unit);
    }
    seconds /= amount;
  }

  return rtf.format(Math.round(seconds), "year");
}
