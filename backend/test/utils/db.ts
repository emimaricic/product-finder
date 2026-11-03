import { PrismaService } from '../../src/prisma/prisma.service';

/** Truncate every table except Prisma's migration log — isolates tests. */
export async function truncateAll(prisma: PrismaService): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;
  if (rows.length === 0) return;
  const tables = rows.map(({ tablename }) => `"${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
  );
}
