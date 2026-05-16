import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    const result = await dataSource.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'student_profiles'
    `);
    console.log('Columns for student_profiles:');
    console.table(result);
  } catch (error) {
    console.error('FAILED to query schema:');
    console.error(error);
  } finally {
    await app.close();
  }
}

bootstrap();
