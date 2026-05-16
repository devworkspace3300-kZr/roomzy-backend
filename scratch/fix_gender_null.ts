import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    await dataSource.query(`
      ALTER TABLE student_profiles
      ALTER COLUMN gender DROP NOT NULL;
    `);
    console.log('Successfully made gender column nullable in student_profiles table.');
  } catch (error) {
    console.error('FAILED to alter schema:');
    console.error(error);
  } finally {
    await app.close();
  }
}

bootstrap();
