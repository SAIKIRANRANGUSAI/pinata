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
import * as path from 'path';
import * as fs from 'fs';

@Controller('destore')
export class DeStoreController {
  constructor(private readonly destoreService: DeStoreService) {}

  @Get()
  @Render('destore')
  async showPage() {
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
      // ⛔ NO temp folder on Vercel — use memory buffer
      const tempPath = path.join('/tmp', file.originalname);

      // ✔ /tmp IS ALLOWED ON VERCEL
      fs.writeFileSync(tempPath, file.buffer);

      const result = await this.destoreService.uploadFile(tempPath);

      // Clean temp
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      return res.redirect('/destore');
    } catch (error: any) {
      return res.status(500).send('Internal server error: ' + error.message);
    }
  }
}
