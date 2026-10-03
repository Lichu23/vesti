import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

const envFile = ".env.dev.local";

if (!existsSync(envFile)) {
  throw new Error(`Missing ${envFile}. Create it with your dev database URL.`);
}

loadEnvFile(envFile);

const directUrl = process.env["DEV_DIRECT_URL"];

if (!directUrl) {
  throw new Error(`DEV_DIRECT_URL is required in ${envFile}.`);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
