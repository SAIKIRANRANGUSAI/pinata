import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as hbs from 'hbs';
import express from 'express';

export async function createNestServer() {
  const server = express();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new (require('@nestjs/platform-express').ExpressAdapter)(server)
  );

  // static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // views
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.engine('hbs', hbs.__express);

  await app.init();
  return server;
}

// Local only
async function bootstrap() {
  if (!process.env.VERCEL) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.setViewEngine('hbs');
    app.engine('hbs', hbs.__express);

    await app.listen(process.env.PORT || 3000);
    console.log(`🚀 Local server running at http://localhost:3000`);
  }
}

bootstrap();
