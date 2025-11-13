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
import { DeStoreModule } from './destore/destore.module';
import { DeStoreFile } from './entities/destore.entity';

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
      entities: [PinataUpload, WalrusUpload, TuskyKey, TuskyImage, DeStoreModule, DeStoreFile ],
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
    DeStoreModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
