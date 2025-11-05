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

  @Get()
  @Render('pinata')
  async getAll() {
    const files = await this.pinataService.findAll();
    return { files };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    await this.pinataService.uploadFile(file);
    return res.redirect('/pinata');
  }

  // ✅ Delete route for SweetAlert
  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    return this.pinataService.remove(id);
  }
}
