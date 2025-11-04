import { Injectable } from '@nestjs/common';
import { PinataService } from '../common/pinata.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TuskyWalrusService {
  constructor(private readonly pinataService: PinataService) {}

  async upload(file: Express.Multer.File) {
    const filePath = path.join(__dirname, '../../uploads/tusky-walrus', file.filename);
    const data = await this.pinataService.uploadToPinata(filePath);
    fs.unlinkSync(filePath);
    return data;
  }

  async delete(cid: string) {
    return this.pinataService.deleteFromPinata(cid);
  }
}
