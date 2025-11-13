import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import * as hbs from 'hbs';
import { join } from 'path';

export async function createNestServer() {
  const server = express();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
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

    await app.listen(3000);
    console.log("Local server running: http://localhost:3000");
  }
}
bootstrap();
