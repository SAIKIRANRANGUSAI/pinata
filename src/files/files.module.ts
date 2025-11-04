import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { PinataService } from '../common/pinata.service';

@Module({
  controllers: [FilesController],
  providers: [PinataService],
})
export class FilesModule {}
