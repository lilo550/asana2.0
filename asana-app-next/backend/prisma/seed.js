import bcrypt from "bcrypt";
import { prisma } from "../prismaClient.js";

// Der eine definierte Test-Account fuer lokale Entwicklung.
const TEST_ACCOUNT = {
  email: "test@example.com",
  password: "test1234",
  name: "Test User",
};

const BCRYPT_COST_FACTOR = 12;

async function main() {
  const passwordHash = await bcrypt.hash(TEST_ACCOUNT.password, BCRYPT_COST_FACTOR);

  // upsert statt create: das Skript bleibt so mehrfach ausfuehrbar, ohne bei
  // erneutem Lauf am bereits existierenden Account zu scheitern.
  const user = await prisma.user.upsert({
    where: { email: TEST_ACCOUNT.email },
    update: {},
    create: {
      email: TEST_ACCOUNT.email,
      password: passwordHash,
      name: TEST_ACCOUNT.name,
    },
    select: { id: true, email: true, name: true },
  });

  console.log("Test-Account bereit:", user);
}

main()
  .catch((err) => {
    console.error("Seed fehlgeschlagen:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });