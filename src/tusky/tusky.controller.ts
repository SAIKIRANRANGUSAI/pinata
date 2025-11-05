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
import type { Response } from 'express'; // ✅ fixed import type
import { FileInterceptor } from '@nestjs/platform-express';
import { TuskyService } from './tusky.service';

@Controller('tusky')
export class TuskyController {
  constructor(private readonly tuskyService: TuskyService) {}

  /**
   * Render Tusky dashboard
   */
  @Get()
  @Render('tusky')
  async getPage() {
    const images = await this.tuskyService.findAllImages();
    return { images };
  }

  /**
   * Upload image and return JSON success for SweetAlert
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

      // ✅ Return success for SweetAlert UI
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
