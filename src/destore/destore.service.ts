// src/destore/destore.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { DeStoreFile } from '../entities/destore.entity';

@Injectable()
export class DeStoreService {
  private readonly logger = new Logger(DeStoreService.name);
  private readonly nextcloudUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly destoreFolder: string;
  private readonly chunkSize: number;

  constructor(
    @InjectRepository(DeStoreFile)
    private readonly repo: Repository<DeStoreFile>,
  ) {
    this.nextcloudUrl = process.env.NEXTCLOUD_URL ?? '';
    this.username = process.env.NEXTCLOUD_USERNAME ?? '';
    this.password = process.env.NEXTCLOUD_PASSWORD ?? '';
    this.destoreFolder = process.env.DESTORE_FOLDER ?? 'DeStore-Uploads';
    this.chunkSize = parseInt(process.env.CHUNK_SIZE ?? '10485760', 10);

    this.logger.log(`🚀 DeStore initialized`);
    this.logger.log(`NEXTCLOUD_URL: ${this.nextcloudUrl}`);
    this.logger.log(`NEXTCLOUD USER: ${this.username}`);
    this.logger.log(`SAVE FOLDER: ${this.destoreFolder}`);
  }

  /**
   * ⭐ Create public share link for file
   */
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
          shareType: 3,      // Public link
          permissions: 1,    // Read-only
        },
      }
    );

    return response.data.ocs.data.url;
  }

  /**
   * Upload file + save into DB
   */
  async uploadFile(
    filePath: string,
    filename?: string,
    useChunking: boolean = false,
  ) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${resolvedPath}`);
      }

      const stats = fs.statSync(resolvedPath);
      const fileSize = stats.size;
      filename = filename ?? path.basename(resolvedPath);

      // Normalize remote path
      let remotePath = `${this.destoreFolder}/${filename}`.replace(/\\/g, '/');
      remotePath = remotePath.replace(/^\//, '');

      this.logger.log(`Uploading: ${filename} → ${remotePath}`);

      const shouldChunk = useChunking || fileSize > this.chunkSize * 5;

      const result = shouldChunk
        ? await this.uploadChunked(resolvedPath, remotePath)
        : await this.uploadSimple(resolvedPath, remotePath);

      // ⭐ GET PUBLIC URL
      const publicUrl = await this.createPublicShare(remotePath);

      // Save to DB
      const saved = await this.repo.save({
        filename,
        remote_path: remotePath,
        url: publicUrl,
        size: fileSize,
        chunked: shouldChunk ? 1 : 0,
      });

      return {
        success: true,
        file: saved,
      };
    } catch (error: any) {
      const msg = error?.response?.data || error?.message || 'Unknown upload error';
      this.logger.error('❌ uploadFile error:', msg);
      throw new InternalServerErrorException(`Upload failed: ${msg}`);
    }
  }

  /**
   * Simple upload
   */
  private async uploadSimple(filePath: string, remotePath: string) {
    const webdavUrl = `${this.nextcloudUrl}/remote.php/dav/files/${this.username}/${remotePath}`;

    const response = await axios.put(webdavUrl, fs.createReadStream(filePath), {
      auth: { username: this.username, password: this.password },
      headers: { 'Content-Type': 'application/octet-stream' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return { status: response.status };
  }

  /**
   * Chunked upload
   */
  private async uploadChunked(filePath: string, remotePath: string) {
    const uploadId = `web-upload-${Date.now()}`;
    const tempPath = `/uploads/${this.username}/${uploadId}`;
    const fileBuffer = fs.readFileSync(filePath);

    const totalChunks = Math.ceil(fileBuffer.length / this.chunkSize);
    const destination = `${this.nextcloudUrl}/remote.php/dav/files/${this.username}/${remotePath}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);

      const chunkUrl = `${this.nextcloudUrl}/remote.php/dav${tempPath}/${i}`;

      await axios.put(chunkUrl, chunk, {
        auth: { username: this.username, password: this.password },
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': chunk.length.toString(),
          'Destination': destination,
        },
      });
    }

    await axios(`${this.nextcloudUrl}/remote.php/dav${tempPath}/.file`, {
      method: 'MOVE',
      auth: { username: this.username, password: this.password },
      headers: { Destination: destination },
    });

    return { status: 201 };
  }

  /**
   * Fetch all files
   */
  async getAllFiles() {
    return await this.repo.find({ order: { id: 'DESC' } });
  }
}
