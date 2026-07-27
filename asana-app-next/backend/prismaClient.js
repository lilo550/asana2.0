import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma = new PrismaClient({ adapter });

// Solange es keine Authentifizierung gibt, haengen neue Events ohne
// explizite userId an einem einzigen Default-User.
export async function getDefaultUserId() {
  const existing = await prisma.user.findFirst();
  if (existing) return existing.id;
  const created = await prisma.user.create({ data: { name: "Default User" } });
  return created.id;
}