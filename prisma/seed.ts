import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "assmat@example.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMoi123!";
  const name = process.env.ADMIN_NAME || "Assistante maternelle";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Compte admin deja existant pour ${email}, rien a faire.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, name },
  });

  console.log(`Compte admin cree : ${email} / mot de passe : ${password}`);
  console.log("Pensez a changer ce mot de passe en production.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
