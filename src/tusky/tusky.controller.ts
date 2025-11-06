import {
  Controller,
  Get,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
  Body,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { TuskyService } from './tusky.service';

@Controller('tusky')
export class TuskyController {
  constructor(private readonly tuskyService: TuskyService) {}

  /**
   * 🟢 Render Tusky dashboard page
   */
  @Get()
  @Render('tusky')
  async getPage() {
    const images = await this.tuskyService.findAllImages();

    // Format dates for Handlebars (no inline JS)
    const formatted = images.map((img) => ({
      ...img,
      createdAt: new Date(img.createdAt).toLocaleString(),
    }));

    return {
      title: '🐘 Tusky Image Dashboard',
      images: formatted,
      currentYear: new Date().getFullYear(),
    };
  }

  /**
   * 🟢 Upload image (used by SweetAlert + Fetch)
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('storageType') storageType: 'walrus' | 'pinata',
    @Res() res: Response,
  ) {
    try {
      await this.tuskyService.createImage(file, storageType);

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully!',
      });
    } catch (error: any) {
      console.error('❌ Upload error:', error.message || error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image',
      });
    }
  }
}
