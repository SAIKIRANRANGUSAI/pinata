import { Module } from '@nestjs/common';
import { DeStoreController } from './destore.controller';
import { DeStoreService } from './destore.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeStoreFile } from '../entities/destore.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeStoreFile])],
  controllers: [DeStoreController],
  providers: [DeStoreService],
})
export class DeStoreModule {}
