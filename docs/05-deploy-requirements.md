# Production Deploy Requirements

Use this checklist before deploying the store to production.

## Quick path

1. Confirm the branch is clean and pushed.
2. Run local validation.
3. Apply production database migrations.
4. Confirm production environment variables.
5. Deploy to Vercel.
6. Smoke test the live URL.

## Pre-deploy checklist

- [ ] The branch has the latest production-ready changes.
- [ ] `pnpm db:validate` passes.
- [ ] `pnpm build` passes.
- [ ] Production environment variables are configured in Vercel.
- [ ] Google OAuth has the production callback URL.
- [ ] Supabase Storage is configured for product images.
- [ ] Production database migrations have been applied with `pnpm db:deploy`.

## Required environment variables

Configure these in Vercel for Production:

```txt
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
NEXT_PUBLIC_APP_URL
```

`NEXT_PUBLIC_APP_URL` must use the production domain:

```txt
https://your-domain.com
```

## Google OAuth

Add the production callback URL in Google Cloud:

```txt
https://your-domain.com/api/auth/callback/google
```

Keep the local callback too:

```txt
http://localhost:3000/api/auth/callback/google
```

## Database migrations

Use this command for production migrations:

```bash
pnpm db:deploy
```

Do not use this command for production:

```bash
pnpm db:migrate
```

`db:migrate` uses `prisma migrate dev`, which is for local development.

## Recommended deploy order

```bash
pnpm db:validate
pnpm build
pnpm db:deploy
```

Then deploy the verified branch to Vercel.

## Smoke test after deploy

- [ ] Storefront loads.
- [ ] Product pages load.
- [ ] Cart works.
- [ ] Google login works.
- [ ] Admin redirects to `/admin` after login.
- [ ] Owner can access Settings.
- [ ] Owner can invite an admin or owner.
- [ ] Product image upload works.

