import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const root = process.cwd();
  const viewsPath = join(root, 'views'); // ✅ Fixed: No 'dist/' for serverless/prod flattening
  const publicPath = join(root, 'public'); // ✅ Fixed: No 'dist/' 
  app.useStaticAssets(publicPath, { prefix: '/' });
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');
  try {
    hbs.registerPartials(join(viewsPath, 'partials'));
  } catch {}
  await app.listen(process.env.PORT || 3000);
}
bootstrap();