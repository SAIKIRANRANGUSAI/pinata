import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as hbs from 'hbs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // view engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.engine('hbs', hbs.__express);

  await app.listen(process.env.PORT || 3000);
  console.log(`✅ Server running at http://localhost:3000`);
}
bootstrap();
