import { defineConfig } from "prisma/config"
import path from "path"

const dbPath = "file:" + path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: dbPath,
  },
})