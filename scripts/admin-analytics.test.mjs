import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { queryTraffic, trafficRange } from "../lib/analytics-query.ts";

const require = createRequire(import.meta.url);
const config = { projectId: "project-test", storeId: "store-test", teamId: "team-test", token: "test-token" };
const range = trafficRange(7, new Date("2026-09-13T15:00:00Z"));
const fixture = {
  environment: [{ environment: "production", pageviews: 30, visitors: 8 }],
  day: [{ timestamp: "2026-09-06T00:00:00Z", pageviews: 10, visitors: 6 }, { timestamp: "2026-09-07T00:00:00Z", pageviews: 20, visitors: 7 }],
  requestPath: [{ requestPath: "/", pageviews: 20 }, { requestPath: "/products/example", pageviews: 10 }, { requestPath: "Others", pageviews: 0 }],
};
const fakeFetch = (data = fixture) => async (url) => Response.json({ data: data[url.searchParams.get("by")] });

test("complete UTC ranges are stable across timezones and month boundaries", () => {
  assert.deepEqual(range, { since: "2026-09-06T00:00:00.000Z", until: "2026-09-12T23:59:59.999Z" });
  assert.equal(trafficRange(30, new Date("2026-03-01T03:00:00Z")).since, "2026-01-30T00:00:00.000Z");
});

test("three bounded, filtered queries preserve period visitors and fill empty days", async () => {
  let requests = 0;
  const report = await queryTraffic(config, range, async (url, options) => {
    requests++;
    assert.equal(url.origin, "https://api.vercel.com");
    assert.equal(url.searchParams.get("projectId"), config.projectId);
    assert.equal(url.searchParams.get("teamId"), config.teamId);
    assert.equal(url.searchParams.get("since"), range.since);
    assert.equal(url.searchParams.get("until"), range.until);
    const filter = url.searchParams.get("filter");
    assert.match(filter, /environment eq 'production'.*requestPath ne '\/admin'.*not startswith\(requestPath, '\/admin\/'\)/);
    assert.match(filter, /requestPath ne '\/api'.*not startswith\(requestPath, '\/api\/'\)/);
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.ok(Number(url.searchParams.get("limit")) <= 30);
    return fakeFetch()(url);
  });
  assert.equal(requests, 3);
  assert.equal(report.pageviews, 30);
  assert.equal(report.visitors, 8); // Not 6 + 7 daily visitors.
  assert.equal(report.daily.length, 7);
  assert.equal(report.daily[2].pageviews, 0);
  assert.equal(report.pages.length, 2);
  assert.ok(!JSON.stringify(report).includes("test-token"));
});

test("empty data is honest zero; malformed data is not silently zero", async () => {
  const empty = await queryTraffic(config, range, fakeFetch({ environment: [], day: [], requestPath: [] }));
  assert.equal(empty.pageviews, 0);
  for (const data of [
    { ...fixture, environment: [{ environment: "production", pageviews: "30", visitors: 8 }] },
    { ...fixture, day: [{ timestamp: "bad", pageviews: 2 }] },
    { ...fixture, requestPath: [{ requestPath: "/admin/orders", pageviews: 2 }] },
    { ...fixture, environment: {} },
  ]) await assert.rejects(queryTraffic(config, range, fakeFetch(data)), /Invalid/);
});

test("analytics excludes exact admin and API route roots from reports", async () => {
  for (const requestPath of ["/admin", "/admin/", "/api", "/api/"]) {
    await assert.rejects(
      queryTraffic(config, range, fakeFetch({ ...fixture, requestPath: [{ requestPath, pageviews: 2 }] })),
      /Invalid analytics path/,
    );
  }
});

test("upstream failures are bounded and do not reveal response bodies", async () => {
  await assert.rejects(queryTraffic(config, range, async () => new Response("sensitive upstream details", { status: 403 })), /Analytics upstream unavailable/);
  const start = performance.now();
  await assert.rejects(queryTraffic(config, range, (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  }), 25), /aborted/);
  assert.ok(performance.now() - start < 1000);
});

// Run real route/cache modules with isolated boundary doubles, without credentials or a database.
function loadModule(path, mocks) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, { exports, require: (name) => name in mocks ? mocks[name] : require(name), Response, URL, process: { env: {} } });
  return exports;
}

test("route authenticates and checks tenant before any analytics access; HTTP responses never cache", async () => {
  let user = null;
  let configured = config;
  let primary = { id: config.storeId };
  let calls = 0;
  let allowed = true;
  const { GET } = loadModule("app/api/admin/analytics/route.ts", {
    "@/lib/auth": { auth: async () => user ? { user } : null },
    "@/lib/storefront": { getPrimaryStore: async () => primary },
    "@/lib/rate-limit": { checkRateLimit: () => ({
      limit: 20,
      remaining: allowed ? 19 : 0,
      resetAt: Date.now() + 60_000,
      success: allowed,
    }) },
    "@/lib/admin-analytics": { analyticsConfig: () => configured, getAdminTraffic: async () => { calls++; return { pageviews: 30 }; } },
  });
  const request = (days = "7") => GET(new Request(`http://localhost/api/admin/analytics?days=${days}`));
  assert.equal((await request()).status, 401);
  user = { id: "u1", storeId: config.storeId, role: "STAFF" };
  assert.equal((await request()).status, 403);
  user.role = "ADMIN";
  user.storeId = "another-store";
  assert.equal((await request()).status, 403);
  user.storeId = config.storeId;
  assert.equal((await request("500")).status, 400);
  configured = null;
  assert.equal((await (await request()).json()).status, "unconfigured");
  configured = config;
  primary = { id: "different-primary" };
  assert.equal((await (await request()).json()).status, "unconfigured");
  assert.equal(calls, 0);
  primary = { id: config.storeId };
  const response = await request();
  assert.equal((await response.json()).status, "ready");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-ratelimit-limit"), "20");
  assert.equal(calls, 1);
  allowed = false;
  const limited = await request();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("x-ratelimit-remaining"), "0");
  assert.ok(Number(limited.headers.get("retry-after")) >= 1);
  assert.equal(calls, 1);
});

test("cache namespace binds store, project, team, date range and credential rotation", () => {
  const keys = [];
  const { getAdminTraffic } = loadModule("lib/admin-analytics.ts", {
    "server-only": {},
    "next/cache": { unstable_cache: (_callback, key, options) => { keys.push(key); assert.equal(options.revalidate, 300); return () => Promise.resolve(); } },
    "@/lib/analytics-query": { queryTraffic, trafficRange },
  });
  getAdminTraffic(config, 7);
  getAdminTraffic(config, 7);
  assert.deepEqual(keys[0], keys[1]);
  for (const patch of [{ storeId: "other" }, { projectId: "other" }, { teamId: "other" }, { token: "rotated" }]) {
    getAdminTraffic({ ...config, ...patch }, 7);
    assert.notDeepEqual(keys[0], keys.at(-1));
  }
  getAdminTraffic(config, 30);
  assert.notDeepEqual(keys[0], keys.at(-1));
  assert.ok(!JSON.stringify(keys).includes("test-token"));
});

test("panel server-render performs no upstream work and dashboard only imports client panel", () => {
  const { renderToString } = require("react-dom/server");
  const React = require("react");
  const { TrafficPanel } = loadModule("app/admin/traffic-panel.tsx", {});
  const html = renderToString(React.createElement(TrafficPanel));
  assert.match(html, /Cargando estadísticas/);
  const page = readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(page, /<TrafficPanel\s*\/>/);
  assert.doesNotMatch(page, /getAdminTraffic|queryTraffic|api\/admin\/analytics/);
});
