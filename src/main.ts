import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static assets (CSS, images, JS)
  app.use(express.static(join(__dirname, '..', 'public')));

  // EJS view engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Server running at http://localhost:3000`);
}
bootstrap();
