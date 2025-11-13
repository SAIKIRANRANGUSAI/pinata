import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';
import express from 'express';

// Exported server for Vercel
export async function createNestServer() {
  const server = express();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server)
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.engine('hbs', hbs.__express);

  await app.init();
  return server;
}

export default createNestServer;

// Local dev mode
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
