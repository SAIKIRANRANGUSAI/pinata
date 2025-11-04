import { Module } from '@nestjs/common';
import { PinataController } from './pinata.controller';
import { LocalPinataService } from './pinata.service';
import { PinataModule as CommonPinataModule } from '../common/pinata.module';

@Module({
  imports: [CommonPinataModule],
  controllers: [PinataController],
  providers: [LocalPinataService],
})
export class PinataModule {}
