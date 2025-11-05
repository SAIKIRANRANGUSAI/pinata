// import {
//   Controller,
//   Post,
//   UseInterceptors,
//   UploadedFile,
//   Get,
//   Delete,
//   Param,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// import * as fs from 'fs';

// @Controller('files')
// export class FilesController {
//   constructor(private readonly pinataService: PinataService) {
//     const dir = './uploads';
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//   }

//   @Post('upload')
//   @UseInterceptors(
//     FileInterceptor('file', {
//       storage: diskStorage({
//         destination: './uploads',
//         filename: (req, file, cb) =>
//           cb(null, `${Date.now()}${extname(file.originalname)}`),
//       }),
//     }),
//   )
//   // async upload(@UploadedFile() file: Express.Multer.File) {
//   //   const res = await this.pinataService.uploadToPinata(file.path);
//   //   return { message: 'File uploaded successfully', data: res };
//   // }

//   // @Delete(':cid')
//   // async deleteFile(@Param('cid') cid: string) {
//   //   await this.pinataService.deleteFromPinata(cid);
//   //   return { message: 'File deleted successfully' };
//   // }
// }
