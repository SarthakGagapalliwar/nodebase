import "dotenv/config";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: resolve("./prisma/schema.prisma"),
  migrations: {
    path: resolve("./prisma/migrations"),
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
