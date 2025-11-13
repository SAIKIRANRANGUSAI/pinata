import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Views
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.engine('hbs', hbs.__express);

  await app.listen(process.env.PORT || 3000);
  console.log(`Server running`);
}

bootstrap();
