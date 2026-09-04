<<<<<<< HEAD
import 'dotenv/config';
=======
>>>>>>> 2f653e8d1f3cc63968de83e15ee64bc2f9afe46b
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
<<<<<<< HEAD
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
=======

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});
>>>>>>> 2f653e8d1f3cc63968de83e15ee64bc2f9afe46b
