import "server-only";

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";

import { queryTraffic, trafficRange } from "@/lib/analytics-query";

export function analyticsConfig() {
  const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim();
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim();
  const storeId = process.env.VERCEL_ANALYTICS_STORE_ID?.trim();
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID?.trim() ?? "";
  return token && projectId && storeId ? { token, projectId, storeId, teamId } : null;
}

export function getAdminTraffic(config: NonNullable<ReturnType<typeof analyticsConfig>>, days: 7 | 30) {
  const range = trafficRange(days);
  // Credentials never enter cache values; rotation invalidates the old cache namespace.
  const credentialVersion = createHash("sha256").update(config.token).digest("hex");
  return unstable_cache(
    async () => {
      try {
        return await queryTraffic(config, range);
      } catch (error) {
        const errorName = error && typeof error === "object" && "name" in error
          ? String(error.name)
          : "unknown";
        console.error("[admin analytics] upstream request failed", {
          reason: errorName === "AbortError" ? "timeout" : "request_failed",
          source: "vercel-web-analytics",
        });
        throw error;
      }
    },
    ["admin-traffic-v1", config.storeId, config.projectId, config.teamId, credentialVersion, range.since, range.until],
    { revalidate: 300 },
  )();
}
