// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PinataModule } from './pinata/pinata.module';
import { WalrusModule } from './walrus/walrus.module';
import { TuskyModule } from './tusky/tusky.module';
import { PinataUpload } from './entities/pinata.entity';
import { WalrusUpload } from './entities/walrus.entity';
import { TuskyKey, TuskyImage } from './entities/tusky.entity';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [PinataUpload, WalrusUpload, TuskyKey, TuskyImage],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),

    // ✅ Memory-based storage (no /uploads folder)
    MulterModule.register({
      storage: memoryStorage(),
    }),

    PinataModule,
    WalrusModule,
    TuskyModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
