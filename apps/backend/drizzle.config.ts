import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/database/migration",
  schema: "./src/database/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

// bun run db:generate db:migrate
