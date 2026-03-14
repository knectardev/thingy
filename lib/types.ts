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
  let seconds = (new Date(isoString).getTime() - Date.now()) / 1000;

  for (const { amount, unit } of TIME_DIVISIONS) {
    if (Math.abs(seconds) < amount) {
      return rtf.format(Math.round(seconds), unit);
    }
    seconds /= amount;
  }

  return rtf.format(Math.round(seconds), "year");
}
