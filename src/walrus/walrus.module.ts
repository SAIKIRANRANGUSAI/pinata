import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalrusUpload } from '../entities/walrus.entity';
import { WalrusService } from './walrus.service';
import { WalrusController } from './walrus.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WalrusUpload])],
  controllers: [WalrusController],
  providers: [WalrusService],
  exports: [WalrusService],
})
export class WalrusModule {}
