import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { NestFactory }        from '@nestjs/core';
import { ValidationPipe }     from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }          from './app.module';
import { ResponseInterceptor }from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
 
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 
  // ── Global prefix — all routes become /api/v1/... ──────────
  app.setGlobalPrefix('api/v1');
 
  // ── CORS — allow your frontend to call this backend ─────────
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      'https://roomzy.pk',
      'https://www.roomzy.pk',
      'https://roomzy-frontend.vercel.app', // Added Vercel URL explicitly
      'https://roomzy.filenod.com',
      'http://localhost:5173',
      'http://localhost:3001',
    ].filter(Boolean),
    methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['*'],
    credentials:    true,
  });
  
  // ── Global validation — auto-validates all DTO classes ───────
  app.useGlobalPipes(new ValidationPipe({
    whitelist:        true,  // Strip unknown fields from request body
    forbidNonWhitelisted: false,
    transform:        true,  // Auto-convert strings to numbers etc.
  }));
 
  // ── Global response wrapper ───────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());
 
  // ── Global error handler ──────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
 
  // ── Swagger API documentation ─────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Roomzy API')
    .setDescription('Pakistan Student Accommodation Platform — API Reference')
    .setVersion('1.0')
    .addBearerAuth()  // Adds the 'Authorize' button — paste token here to test
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Roomzy API running at:  http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs available: http://localhost:${port}/api/docs`);
  
  const dbInfo = process.env.DATABASE_URL 
    ? 'Connected via DATABASE_URL (Supabase)'
    : `${process.env.DB_NAME}@${process.env.DB_HOST}`;
  console.log(`🗄  Database Status: ${dbInfo}`);
}
bootstrap();
