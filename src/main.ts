import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // 👇 Tell Nest we’re using Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Static files (CSS, JS, etc.)
  app.use(express.static(join(__dirname, '..', 'public')));

  // EJS view engine setup
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  app.setViewEngine('ejs');

  await app.listen(3000);
  console.log(`🚀 Server running at http://localhost:3000`);
}
bootstrap();
