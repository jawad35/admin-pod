import { defineConfig } from "drizzle-kit";


export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.xeoibzogtmxqzvihnkfn:hahajaja321786@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  },
});
