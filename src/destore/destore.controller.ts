// src/destore/destore.controller.ts
import {
  Controller,
  Get,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeStoreService } from './destore.service';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('destore')
export class DeStoreController {
  constructor(private readonly destoreService: DeStoreService) {}

  @Get()
  @Render('destore')
  async showPage() {
    // ⭐ GET ALL FILE RECORDS FROM DATABASE
    const files = await this.destoreService.getAllFiles();

    return {
      title: 'DeStore File Upload',
      files,
      currentYear: new Date().getFullYear(),
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

      const tempPath = path.join(uploadDir, file.originalname);
      fs.writeFileSync(tempPath, file.buffer);

      // ⭐ UPLOAD + STORE IN DB
      const result = await this.destoreService.uploadFile(tempPath);

      fs.unlinkSync(tempPath);

      if (result.success) {
        return res.redirect('/destore');
      } else {
        return res.status(400).send('Upload failed');
      }
    } catch (error: any) {
      return res.status(500).send('Internal server error: ' + error.message);
    }
  }
}
