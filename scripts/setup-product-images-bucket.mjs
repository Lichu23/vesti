import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const bucketName = "product-images";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const { data: buckets, error: listError } =
  await supabase.storage.listBuckets();

if (listError) {
  console.error(listError.message);
  process.exit(1);
}

const bucketExists = buckets.some((bucket) => bucket.id === bucketName);

const options = {
  allowedMimeTypes: ["image/avif", "image/jpeg", "image/png", "image/webp"],
  fileSizeLimit: 5 * 1024 * 1024,
  public: true,
};

const { error } = bucketExists
  ? await supabase.storage.updateBucket(bucketName, options)
  : await supabase.storage.createBucket(bucketName, options);

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Supabase Storage bucket ready: ${bucketName}`);
