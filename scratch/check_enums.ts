
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    const result = await dataSource.query(`
      SELECT n.nspname AS enum_schema,  
             t.typname AS enum_name,  
             e.enumlabel AS enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'room_availability_status'
    `);
    console.log('Database enum values for room_availability_status:');
    console.log(result);
  } catch (error) {
    console.error('FAILED to query enum values:');
    console.error(error);
  } finally {
    await app.close();
  }
}

bootstrap();
