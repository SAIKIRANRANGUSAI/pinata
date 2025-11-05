import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PinataUpload } from '../entities/pinata.entity';
import { PinataService } from './pinata.service';
import { PinataController } from './pinata.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PinataUpload])],
  controllers: [PinataController],
  providers: [PinataService],
  exports: [PinataService],
})
export class PinataModule {}
