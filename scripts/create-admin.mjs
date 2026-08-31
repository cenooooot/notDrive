import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email =
    args[0] ||
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_EMAILS?.split(",")[0];
  const password = args[1] || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.mjs <email> <password>");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      name: normalizedEmail.split("@")[0],
      role: "ADMIN",
      password: hashedPassword,
    },
    update: {
      role: "ADMIN",
      password: hashedPassword,
    },
  });

  console.log(
    `✅ Admin user [${user.email}] successfully created/updated in database with role ADMIN!`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error creating admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
