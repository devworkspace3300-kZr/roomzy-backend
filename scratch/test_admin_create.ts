import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  
  try {
    const result = await usersService.adminCreateUser({
      fullName: 'Test Student',
      email: 'teststudent123@roomzy.com',
      phone: '1234567890',
      role: 'student',
      password: 'password123'
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('FAILED to create user:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
