import { defineConfig } from "prisma/config"
import path from "path"

const dbPath = "file:" + path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: dbPath,
  },
  migrate: {
    async adapter() {
      const { PrismaLibSQL } = await import("@prisma/adapter-libsql")
      const { createClient } = await import("@libsql/client")
      const client = createClient({ url: dbPath })
      return new PrismaLibSQL(client)
    },
  },
})
