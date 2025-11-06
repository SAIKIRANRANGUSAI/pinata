import {
  Controller,
  Get,
  Post,
  Render,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WalrusService } from './walrus.service';
import type { Response } from 'express';

@Controller('walrus')
export class WalrusController {
  constructor(private readonly walrusService: WalrusService) {}

  // 🟢 RENDER WALRUS PAGE (Frontend)
  @Get()
  @Render('walrus')
  async showPage() {
    const files = await this.walrusService.findAll();

    // ✅ Format data for Handlebars (no inline JS)
    const formattedFiles = files.map((file) => ({
      ...file,
      createdAt: new Date(file.createdAt).toLocaleString(),
    }));

    return {
      title: '🐋 Walrus Image Uploader',
      files: formattedFiles,
      currentYear: new Date().getFullYear(),
    };
  }

  // 🟢 FILE UPLOAD ENDPOINT
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      await this.walrusService.uploadFile(file);
      return res.redirect('/walrus');
    } catch (error) {
      console.error('❌ Walrus upload failed:', error.message);
      return res.status(500).send('Failed to upload file to Walrus');
    }
  }

  // 🟢 OPTIONAL: JSON API FOR FILES
  @Get('files')
  async getAll() {
    const files = await this.walrusService.findAll();
    return files;
  }
}
