// Seeds the DEV database with a store, an owner invite and a few categories.
// Usage: pnpm db:seed:dev you@gmail.com   (the Google account you sign in with)
// The invite is accepted automatically on your first Google sign-in.
import { readFileSync } from "node:fs";
import pg from "pg";

const email = process.argv[2]?.trim().toLowerCase();

if (!email || !email.includes("@")) {
  console.error("Usage: pnpm db:seed:dev <google-email>");
  process.exit(1);
}

function readDevUrl() {
  const content = readFileSync(".env.dev.local", "utf8");
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("DEV_DIRECT_URL="));

  if (!line) {
    throw new Error("DEV_DIRECT_URL is missing in .env.dev.local.");
  }

  return line.slice("DEV_DIRECT_URL=".length).trim().replace(/^["']|["']$/g, "");
}

const storeSlug = "tienda-dev";
const categories = [
  { name: "Remeras", slug: "remeras" },
  { name: "Ropa interior", slug: "ropa-interior" },
  { name: "Pijamas", slug: "pijamas" },
];

const client = new pg.Client({ connectionString: readDevUrl() });

await client.connect();

try {
  await client.query("BEGIN");

  const store = await client.query(
    `INSERT INTO "Store" (id, name, slug, "isActive", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), 'Tienda Dev', $1, true, now(), now())
     ON CONFLICT (slug) DO UPDATE SET "updatedAt" = now()
     RETURNING id`,
    [storeSlug],
  );
  const storeId = store.rows[0].id;

  for (const [index, category] of categories.entries()) {
    await client.query(
      `INSERT INTO "Category" (id, "storeId", name, slug, "isActive", "sortOrder", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, true, $4, now(), now())
       ON CONFLICT ("storeId", slug) DO NOTHING`,
      [storeId, category.name, category.slug, index],
    );
  }

  const user = await client.query(
    `UPDATE "User" SET "storeId" = $1, role = 'OWNER', "updatedAt" = now()
     WHERE email = $2 RETURNING id`,
    [storeId, email],
  );

  if (user.rowCount === 0) {
    await client.query(
      `INSERT INTO "StoreInvite" (id, "storeId", email, role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'OWNER', now(), now())
       ON CONFLICT ("storeId", email)
       DO UPDATE SET "acceptedAt" = NULL, role = 'OWNER', "updatedAt" = now()`,
      [storeId, email],
    );
  }

  await client.query("COMMIT");
  console.log(
    user.rowCount === 0
      ? `Store "${storeSlug}" ready. Sign in with ${email}; the owner invite is accepted on first login.`
      : `Store "${storeSlug}" ready. Existing user ${email} is now OWNER of it.`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
