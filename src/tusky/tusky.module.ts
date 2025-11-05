// src/tusky/tusky.module.ts (Add Multer & inject services)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { TuskyService } from './tusky.service';
import { TuskyController } from './tusky.controller';
import { TuskyKey, TuskyImage } from '../entities/tusky.entity';
import { WalrusModule } from '../walrus/walrus.module'; // For WalrusService
import { PinataModule } from '../pinata/pinata.module'; // For PinataService

@Module({
  imports: [
    TypeOrmModule.forFeature([TuskyKey, TuskyImage]),
    MulterModule.register({ dest: './uploads/tmp' }), // Temp dir for files
    WalrusModule,
    PinataModule,
  ],
  providers: [TuskyService],
  controllers: [TuskyController],
  exports: [TuskyService],
})
export class TuskyModule {}