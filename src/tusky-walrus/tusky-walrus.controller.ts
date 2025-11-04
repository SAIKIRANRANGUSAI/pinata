import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Render,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { PinataService } from '../common/pinata.service';

@Controller('tusky-walrus')
export class TuskyWalrusController {
  private uploadedFiles: { name: string; cid: string; url: string; timestamp: string }[] = [];

  constructor(private readonly pinataService: PinataService) {
    const dir = './uploads/tusky-walrus';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  @Get()
  @Render('tusky-walrus')
  getAll() {
    return { files: this.uploadedFiles };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/tusky-walrus',
        filename: (req, file, cb) => cb(null, `${Date.now()}${extname(file.originalname)}`),
      }),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const result = await this.pinataService.uploadToPinata(file.path);

    fs.unlinkSync(file.path);

    this.uploadedFiles.push({
      name: file.originalname,
      cid: result.cid,
      url: result.url,
      timestamp: result.timestamp,
    });

    return { message: 'File uploaded successfully', data: result };
  }
}
