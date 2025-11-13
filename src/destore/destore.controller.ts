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
      // ✔ Vercel allows only this folder
      const tempPath = `/tmp/${file.originalname}`;

      // Save temporarily ONLY in /tmp
      fs.writeFileSync(tempPath, file.buffer);

      // Upload to NextCloud from the /tmp path
      await this.destoreService.uploadFile(tempPath);

      // Remove the file
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      return res.redirect('/destore');
    } catch (err: any) {
      return res.status(500).send('Internal server error: ' + err.message);
    }
  }
}
