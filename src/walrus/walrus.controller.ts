import {
  Controller,
  Get,
  Post,
  Render,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WalrusService } from './walrus.service';

@Controller('walrus')
export class WalrusController {
  constructor(private readonly walrusService: WalrusService) {}

  // 🟢 FRONTEND PAGE - show upload form + uploaded files
  @Get()
  @Render('walrus') // this will use views/walrus.ejs
  async showPage() {
    const files = await this.walrusService.findAll();
    return { title: 'Walrus Uploads', files };
  }

  // 🟢 API ENDPOINT - handle file upload
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return await this.walrusService.uploadFile(file);
  }

  // 🟢 API ENDPOINT - get JSON list of uploads (optional)
  @Get('files')
  async getAll() {
    return await this.walrusService.findAll();
  }
}
