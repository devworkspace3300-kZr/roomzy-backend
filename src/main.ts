import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { NestFactory }        from '@nestjs/core';
import { ValidationPipe }     from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }          from './app.module';
import { ConfigService }      from '@nestjs/config';
import { ResponseInterceptor }from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
 
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 
  // ── Global prefix ──────────
  app.setGlobalPrefix('api/v1');
 
  // ── CORS — extremely permissive for debugging connectivity ─────────
  app.enableCors({
    origin: true, // Allows all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // ── Global validation ───────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
 
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
 
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Roomzy API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  
  // Railway require listening on 0.0.0.0
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Roomzy API is LIVE on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Public URL: https://roomzy-backend.up.railway.app/api/v1`);
}
bootstrap();



