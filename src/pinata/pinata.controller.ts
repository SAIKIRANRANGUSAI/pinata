import {
  Controller,
  Get,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
  Res,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PinataService } from './pinata.service';

@Controller('pinata')
export class PinataController {
  constructor(private readonly pinataService: PinataService) {}

  /**
   * GET /pinata
   * Renders the Pinata Dashboard view with uploaded files
   */
  @Get()
  @Render('pinata')
  async getAll() {
    const files = await this.pinataService.findAll();

    // ✅ Format date for HBS (no inline JS allowed)
    const formattedFiles = files.map((file) => ({
      ...file,
      createdAt: new Date(file.createdAt).toLocaleString(),
    }));

    return {
      title: '📦 Pinata Dashboard',
      files: formattedFiles,
    };
  }

  /**
   * POST /pinata/upload
   * Uploads a file to Pinata and refreshes the dashboard
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      await this.pinataService.uploadFile(file);
      return res.redirect('/pinata');
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return res.status(500).send('File upload failed');
    }
  }

  /**
   * DELETE /pinata/delete/:id
   * Deletes a record locally (not from IPFS)
   */
  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    try {
      const result = await this.pinataService.remove(id);
      return { deleted: true, result };
    } catch (error) {
      console.error('❌ Delete failed:', error);
      return { deleted: false };
    }
  }
}
