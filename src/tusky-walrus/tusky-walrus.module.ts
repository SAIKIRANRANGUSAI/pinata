import { Module } from '@nestjs/common';
import { TuskyWalrusController } from './tusky-walrus.controller';
import { PinataService } from '../common/pinata.service';

@Module({
  controllers: [TuskyWalrusController],
  providers: [PinataService],
})
export class TuskyWalrusModule {}
