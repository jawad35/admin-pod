import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://pos_database_7ixj_user:ZrTOt7yXS7Y6KXu0ktAWmyV4s4Cq6ft4@dpg-d7j1ggegvqtc739i6dcg-a.ohio-postgres.render.com/pos_database_7ixj?sslmode=require",
  },
});