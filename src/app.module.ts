// src/app.module.ts (Update entities list)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express'; // Global if needed
import { PinataModule } from './pinata/pinata.module';
import { WalrusModule } from './walrus/walrus.module';
import { TuskyModule } from './tusky/tusky.module';
import { PinataUpload } from './entities/pinata.entity';
import { WalrusUpload } from './entities/walrus.entity';
import { TuskyKey, TuskyImage } from './entities/tusky.entity'; // Both
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '46.250.225.169',
      port: '3306',
      username: 'demo_colormo_usr',
      password: 'QRdKdVpp3pnNhXBt',
      database: 'test_walrus',
      entities: [PinataUpload, WalrusUpload, TuskyKey, TuskyImage], // Add both
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),
    MulterModule.register({ dest: './uploads/tmp' }), // Global temp uploads
    PinataModule,
    WalrusModule,
    TuskyModule,
  ],
  controllers: [AppController],
})

export class AppModule {}
