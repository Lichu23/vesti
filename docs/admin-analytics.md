# Enable admin traffic analytics

The `/admin` traffic panel loads separately from inventory and orders. It uses the existing Vercel collector; no extra storefront tracking or chart dependency is added.

## Setup

1. Enable Web Analytics for the production Vercel project and create a server-side access token with access to that project/team.
2. Set these environment variables in the deployment settings (or uncommitted `.env.local` for local use):

   ```dotenv
   VERCEL_ANALYTICS_TOKEN=<access-token>
   VERCEL_ANALYTICS_PROJECT_ID=<prj_project-id>
   VERCEL_ANALYTICS_STORE_ID=<database-store-id>
   VERCEL_ANALYTICS_TEAM_ID=<team-id-if-applicable>
   ```

   The store ID must belong to the **oldest active store**, which currently owns the public storefront. Other stores cannot see this project's analytics. Do not use `NEXT_PUBLIC_` names. Never commit tokens or paste them into chat.
3. Redeploy, sign in as that store's owner/admin, and open `/admin`. Missing configuration shows an explicit message rather than invented zeroes.

## Behavior and limits

- Periods cover the previous 7 or 30 **complete UTC days**, excluding today. Visitors are queried for the whole period, never added across daily or page rows. Vercel's privacy-preserving visitor definition applies, not a count of identifiable people.
- Queries include production only and exclude `/admin`, its descendants, and `/api/` paths. The existing collector remains unchanged. Top pages omit Vercel's `Others` bucket; they need not add up to the total.
- A cold cache makes three parallel aggregate requests: totals by environment, daily views, and top 10 paths. One five-second timeout bounds the upstream work. The client stops waiting after 12 seconds; no polling or automatic retries run.
- Next's server data cache is scoped by store/project/team/date range/credential version and revalidates after 300 seconds. Revalidation is demand-driven and can serve older data while updating or after upstream failure. The displayed consultation timestamp is the actual cached snapshot time. The **Actualizar** button rereads the cache, not a forced upstream refresh.
- Authentication and primary-store checks run before cached analytics access. Responses use `private, no-store`; neither browser nor public CDN responses share protected results. A best-effort in-process per-user limit caps requests at 20/minute; it is not a distributed security quota.
- Available history and API access depend on Vercel's plan, permissions, retention and quotas. Errors show “temporarily unavailable”; they never become zero traffic. No live credentials were needed for fixture tests; verify real data after setup.

## Verify and roll back

Run `node --test scripts/admin-analytics.test.mjs` (Node 22.18+ with native TypeScript stripping), `node node_modules/typescript/bin/tsc --noEmit`, and `node node_modules/eslint/bin/eslint.js`.

After deployment, compare the same UTC range/filter in Vercel, test 7/30 days, and confirm a second-store admin is denied. With the analytics endpoint throttled/offline in browser DevTools, inventory and orders must remain usable. Measure admin loading before/after on the same deployment conditions; fixture checks are not a production latency benchmark.

Disable by removing `VERCEL_ANALYTICS_TOKEN` and redeploying. Full rollback removes the `TrafficPanel` import/render from `app/admin/page.tsx` and the five added implementation/test files plus this guide; no schema or data migration exists.

API contract: [Web Analytics guide](https://vercel.com/docs/analytics/web-analytics-api) and [aggregate endpoint](https://vercel.com/docs/rest-api/web-analytics/aggregates-page-views).
