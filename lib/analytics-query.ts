export type TrafficReport = {
  since: string;
  until: string;
  updatedAt: string;
  pageviews: number;
  visitors: number;
  daily: { date: string; pageviews: number }[];
  pages: { path: string; pageviews: number }[];
};

export type AnalyticsConfig = { projectId: string; teamId: string; token: string };
const DAY = 86_400_000;
const FILTER = "environment eq 'production' and requestPath ne '/admin' and not startswith(requestPath, '/admin/') and requestPath ne '/api' and not startswith(requestPath, '/api/')";

export function trafficRange(days: 7 | 30, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // Complete UTC days keep all three queries consistent and cache keys stable.
  return {
    since: new Date(today - days * DAY).toISOString(),
    until: new Date(today - 1).toISOString(),
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid analytics response");
  return value as Record<string, unknown>;
}

function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Invalid analytics count");
  return value;
}

export function isPublicTrafficPath(value: unknown): value is string {
  return typeof value === "string"
    && value.startsWith("/")
    && value.length <= 2048
    && !/^\/(admin|api)(\/|$)/.test(value);
}

export async function queryTraffic(
  config: AnalyticsConfig,
  range: ReturnType<typeof trafficRange>,
  request: typeof fetch = fetch,
  timeoutMs = 5000,
): Promise<TrafficReport> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  async function aggregate(by: string, limit: number) {
    const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/aggregate");
    url.search = new URLSearchParams({
      projectId: config.projectId, by, ...range, limit: String(limit), filter: FILTER,
      ...(config.teamId ? { teamId: config.teamId } : {}),
    }).toString();
    const response = await request(url, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: "no-store", signal: controller.signal,
    });
    if (!response.ok) throw new Error("Analytics upstream unavailable");
    const data = record(await response.json()).data;
    if (!Array.isArray(data) || data.length > limit + 1) throw new Error("Invalid analytics rows");
    return data.map(record);
  }
  try {
    const [totals, daily, pages] = await Promise.all([
      // A single filtered environment gives period visitors, not summed daily uniques.
      aggregate("environment", 1), aggregate("day", 30), aggregate("requestPath", 10),
    ]);
    if (totals.length > 1 || (totals[0] && totals[0].environment !== "production")) throw new Error("Invalid analytics totals");
    const buckets = new Map<string, number>();
    for (const row of daily) {
      if (typeof row.timestamp !== "string" || !Number.isFinite(Date.parse(row.timestamp))) throw new Error("Invalid analytics date");
      const date = new Date(row.timestamp).toISOString().slice(0, 10);
      if (buckets.has(date)) throw new Error("Duplicate analytics date");
      buckets.set(date, count(row.pageviews));
    }
    const days = [];
    for (let time = Date.parse(range.since); time <= Date.parse(range.until); time += DAY) {
      const date = new Date(time).toISOString().slice(0, 10);
      days.push({ date, pageviews: buckets.get(date) ?? 0 });
      buckets.delete(date);
    }
    if (buckets.size) throw new Error("Analytics date outside range");
    return {
      ...range, updatedAt: new Date().toISOString(),
      pageviews: totals[0] ? count(totals[0].pageviews) : 0,
      visitors: totals[0] ? count(totals[0].visitors) : 0,
      daily: days,
      pages: pages.filter((row) => row.requestPath !== "Others").map((row) => {
        if (!isPublicTrafficPath(row.requestPath)) throw new Error("Invalid analytics path");
        return { path: row.requestPath, pageviews: count(row.pageviews) };
      }).sort((a, b) => b.pageviews - a.pageviews).slice(0, 10),
    };
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
