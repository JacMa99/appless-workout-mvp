// Returns YYYY-MM-DD in America/New_York, regardless of user's local timezone.
export function nyDateKey(d = new Date()): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
  
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
  
    if (!year || !month || !day) throw new Error("Failed to compute NY date key.");
    return `${year}-${month}-${day}`;
  }
  
  // For displaying "X days ago" later, also handy:
  export function nyDateKeyToMs(dateKey: string): number {
    // Interpret dateKey as midnight NY time by formatting it through Intl.
    // Simple approach for MVP: parse as UTC midnight and use day diffs via dateKeys later.
    const [y, m, d] = dateKey.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  }
  