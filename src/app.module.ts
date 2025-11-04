import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PinataModule } from './pinata/pinata.module';

@Module({
  imports: [PinataModule],
  controllers: [AppController],
})
export class AppModule {}
