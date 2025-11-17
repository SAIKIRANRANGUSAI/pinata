// src/destore/destore.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { DeStoreFile } from '../entities/destore.entity';

@Injectable()
export class DeStoreService {
  private readonly logger = new Logger(DeStoreService.name);

  // ⭐ Direct config (works on Vercel)
  private readonly nextcloudUrl = 'https://nextcloud.twinquasar.io';
  private readonly username = 'Sairangu';
  private readonly password = 'Sai@#995946';
  private readonly destoreFolder = 'DeStore-Uploads';
  private readonly chunkSize = 10485760; // 10MB

  constructor(
    @InjectRepository(DeStoreFile)
    private readonly repo: Repository<DeStoreFile>,
  ) {
    this.logger.log(`🚀 DeStore initialized`);
  }

  // ⭐ Create public share link
  private async createPublicShare(remotePath: string): Promise<string> {
    const url = `${this.nextcloudUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares`;

    const response = await axios.post(
      url,
      null,
      {
        auth: { username: this.username, password: this.password },
        headers: { 'OCS-APIRequest': 'true' },
        params: {
          path: `/${remotePath}`,
          shareType: 3,
          permissions: 1,
        },
      }
    );

    return response.data.ocs.data.url;
  }

  // ⭐ Upload file to NextCloud
  async uploadFile(filePath: string, filename?: string) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      filename = filename ?? path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;

      let remotePath = `${this.destoreFolder}/${filename}`.replace(/\\/g, '/');

      this.logger.log(`Uploading: ${filename} → ${remotePath}`);

      const uploadUrl = `${this.nextcloudUrl}/remote.php/dav/files/${this.username}/${remotePath}`;

      const config: AxiosRequestConfig = {
        auth: { username: this.username, password: this.password },
        headers: { 'Content-Type': 'application/octet-stream' },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      };

      // ✔ Simple Upload
      await axios.put(uploadUrl, fs.createReadStream(filePath), config);

      // ✔ Get public link
      const publicUrl = await this.createPublicShare(remotePath);

      // ✔ Save record
      const saved = await this.repo.save({
        filename,
        remote_path: remotePath,
        url: publicUrl,
        size: fileSize,
        chunked: 0,
      });

      return { success: true, file: saved };
    } catch (error: any) {
      const msg = error?.response?.data || error?.message || 'Unknown Error';
      this.logger.error('❌ uploadFile error:', msg);
      throw new InternalServerErrorException(`Upload failed: ${msg}`);
    }
  }

  // ⭐ Get all files (gallery)
  async getAllFiles() {
    return await this.repo.find({ order: { id: 'DESC' } });
  }
}