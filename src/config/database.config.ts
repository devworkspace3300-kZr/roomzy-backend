// import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// export const databaseConfig = (): TypeOrmModuleOptions => ({
  // type: 'postgres',
  // host: process.env.DB_HOST || 'localhost',
  // port: parseInt(process.env.DB_PORT || '5432', 10),
  // username: process.env.DB_USERNAME || 'postgres',
  // password: process.env.DB_PASSWORD || 'khizar0920',
  // database: process.env.DB_NAME || 'roomzy_db',
  
  // CRITICAL: Ensure entities are loaded correctly
  // autoLoadEntities: true,
  
  // Explicitly point to the entities directory as well
  // entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  
  // synchronize: false, // Turned off to prevent enum drop errors
  // logging: true, // Turn on logging to see exactly what TypeORM is doing
//   ssl: false,
// });
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL;

  // If a DATABASE_URL is provided (e.g. Railway or Supabase)
  if (dbUrl) {
    // Mask sensitive info for logging
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Database: Using connection string mode (${maskedUrl.split('@')[1] || 'remote'})`);
    
    return {
      type: 'postgres',
      url: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Required for most cloud DBs
      },
      autoLoadEntities: true,
      synchronize: false,
      logging: ['error', 'warn'],
    };
  }

  // Fallback to individual variables
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10);
  const username = process.env.DB_USERNAME || process.env.PGUSER || 'postgres';
  const database = process.env.DB_NAME || process.env.PGDATABASE || 'roomzy_db';

  console.log(`🔌 Database: Using individual parameters (${host}:${port}/${database})`);

  return {
    type: 'postgres',
    host,
    port,
    username,
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'khizar0920',
    database,
    autoLoadEntities: true,
    synchronize: false,
    logging: ['error', 'warn'],
  };
};