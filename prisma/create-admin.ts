import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@tervix.io';
  const password = 'Admin@Tervix2024';

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.create({
    data: { email, passwordHash, name: 'Super Admin' },
  });

  console.log('✅ Admin created!');
  console.log('Email:   ', email);
  console.log('Password:', password);
  console.log('ID:      ', admin.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
