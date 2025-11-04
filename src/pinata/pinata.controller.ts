import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Render,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { PinataService } from '../common/pinata.service';
import type { Response } from 'express';

@Controller('pinata')
export class PinataController {
  private uploadedFiles: { name: string; cid: string; url: string; timestamp: string }[] = [];

  constructor(private readonly pinataService: PinataService) {
    const dir = './uploads/pinata';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  @Get()
  @Render('pinata')
  getAll() {
    return { files: this.uploadedFiles };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/pinata',
        filename: (req, file, cb) => cb(null, `${Date.now()}${extname(file.originalname)}`),
      }),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      const result = await this.pinataService.uploadToPinata(file.path);
      fs.unlinkSync(file.path);

      this.uploadedFiles.push({
        name: file.originalname,
        cid: result.cid,
        url: result.url,
        timestamp: result.timestamp,
      });

      // Redirect back to the dashboard with success flag
      return res.redirect('/pinata?success=true');
    } catch (error) {
      console.error('Upload Error:', error);
      return res.redirect('/pinata?error=true');
    }
  }
}
