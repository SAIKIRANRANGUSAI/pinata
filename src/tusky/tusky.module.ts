// src/tusky/tusky.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TuskyService } from './tusky.service';
import { TuskyController } from './tusky.controller';
import { TuskyKey, TuskyImage } from '../entities/tusky.entity';
import { WalrusModule } from '../walrus/walrus.module';
import { PinataModule } from '../pinata/pinata.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TuskyKey, TuskyImage]),

    // ✅ Use in-memory file uploads (Vercel safe)
    MulterModule.register({
      storage: memoryStorage(),
    }),

    WalrusModule,
    PinataModule,
  ],
  providers: [TuskyService],
  controllers: [TuskyController],
  exports: [TuskyService],
})
export class TuskyModule {}
