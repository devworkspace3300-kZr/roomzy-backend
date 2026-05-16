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
  // If a DATABASE_URL is provided (e.g. Railway or Supabase)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      autoLoadEntities: true,
      synchronize: false,
      logging: true,
    };
  }

  // Fallback to local development variables
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'khizar0920',
    database: process.env.DB_NAME || 'roomzy_db',
    autoLoadEntities: true,
    synchronize: false,
    logging: true,
    // No SSL for local dev
  };
};