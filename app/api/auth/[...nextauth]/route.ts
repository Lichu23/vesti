import { handlers } from "@/lib/auth";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

const AUTH_RATE_LIMIT = 20;
const AUTH_RATE_WINDOW_MS = 60_000;

function isRateLimitedAuthPath(request: NextRequest) {
  return !request.nextUrl.pathname.endsWith("/session");
}

async function rateLimitedAuthRequest(
  request: NextRequest,
  handler: typeof handlers.GET,
) {
  if (!isRateLimitedAuthPath(request)) {
    return handler(request);
  }

  const result = checkRateLimit(`auth:${getClientAddress(request)}`, {
    limit: AUTH_RATE_LIMIT,
    windowMs: AUTH_RATE_WINDOW_MS,
  });

  if (!result.success) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

    return new Response("Too many authentication requests", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    });
  }

  const response = await handler(request);
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  return response;
}

export function GET(request: NextRequest) {
  return rateLimitedAuthRequest(request, handlers.GET);
}

export function POST(request: NextRequest) {
  return rateLimitedAuthRequest(request, handlers.POST);
}
