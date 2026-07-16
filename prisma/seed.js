const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email =
    process.env.OWNER_EMAIL || 'owner@dropsync.local';

  const password =
    process.env.OWNER_PASSWORD || 'Littlebitlucky3800';

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'John Henry',
      passwordHash,
      role: 'OWNER',
    },
    create: {
      email,
      name: 'John Henry',
      passwordHash,
      role: 'OWNER',
    },
  });

  const org = await prisma.organization.upsert({
    where: { id: 'owner-org' },
    update: {},
    create: { id: 'owner-org', name: 'DropSync Platform' },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: { role: 'OWNER' },
    create: { userId: user.id, organizationId: org.id, role: 'OWNER' },
  });

  console.log(`Owner account ready: ${email} / ${password}`);
}

main().finally(() => prisma.$disconnect());
