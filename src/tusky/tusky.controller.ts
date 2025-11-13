import {
  Controller,
  Get,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
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
    try {
      const images = await this.tuskyService.findAllImages();

      // Format timestamps for handlebars (no inline JS)
      const formatted = images.map((img) => ({
        ...img,
        createdAt: new Date(img.createdAt).toLocaleString(),
      }));

      return {
        title: '🐘 Tusky Walrus Uploader',
        images: formatted,
        currentYear: new Date().getFullYear(),
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch Tusky images:', error.message);
      return {
        title: '🐘 Tusky Walrus Uploader',
        images: [],
        error: 'Failed to load images. Please try again later.',
        currentYear: new Date().getFullYear(),
      };
    }
  }

  /**
   * 🟢 Upload image → Walrus (via TuskyService)
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // 🔥 Upload directly to Walrus through TuskyService
      const result = await this.tuskyService.uploadToWalrus(file);

      return res.status(200).json({
        success: true,
        message: 'File uploaded to Walrus successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Tusky → Walrus upload error:', error.message || error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image to Walrus',
      });
    }
  }
}
