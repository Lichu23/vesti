import { analyticsConfig, getAdminTraffic } from "@/lib/admin-analytics";
import { auth } from "@/lib/auth";
import { getPrimaryStore } from "@/lib/storefront";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function reply(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", ...headers },
  });
}

function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return reply({ status: "unauthorized" }, 401);
    if (!session.user.storeId || !["OWNER", "ADMIN"].includes(session.user.role)) return reply({ status: "forbidden" }, 403);
    const rateLimit = checkRateLimit(`admin-analytics:${session.user.id}`, { limit: 20, windowMs: 60000 });
    const headers = rateLimitHeaders(rateLimit);
    if (!rateLimit.success) {
      return reply({ status: "unavailable" }, 429, {
        ...headers,
        "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
        "X-RateLimit-Remaining": "0",
      });
    }
    const days = new URL(request.url).searchParams.get("days") ?? "7";
    if (days !== "7" && days !== "30") return reply({ status: "invalid_range" }, 400, headers);
    const config = analyticsConfig();
    if (!config) return reply({ status: "unconfigured" }, 200, headers);
    if (session.user.storeId !== config.storeId) return reply({ status: "forbidden" }, 403, headers);
    const store = await getPrimaryStore();
    if (store?.id !== config.storeId) return reply({ status: "unconfigured" }, 200, headers);
    const report = await getAdminTraffic(config, days === "7" ? 7 : 30);
    return reply({ status: "ready", report }, 200, headers);
  } catch {
    // Do not expose upstream bodies, credentials, or authentication/database errors.
    return reply({ status: "unavailable" }, 503);
  }
}
