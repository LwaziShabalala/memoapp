import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./app/db/schema.ts",  // Path to your schema
  dbCredentials: {
    url: "postgresql://postgres.xwrouybxxihamjyzknzf:lwazi12%3F@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
  },
});
