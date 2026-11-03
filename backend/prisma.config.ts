import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `prisma migrate reset` / `migrate dev` re-seed through the same importer.
    seed: 'npm run db:seed',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
