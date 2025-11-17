import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalrusUpload } from '../entities/walrus.entity';
import axios, { AxiosError } from 'axios';

@Injectable()
export class WalrusService {
  private readonly logger = new Logger(WalrusService.name);

  // ✅ Alternative public testnet Walrus publisher (fallback for WAL balance issues on primary)
  // From official docs: https://docs.wal.app/usage/web-api.html
  private readonly WALRUS_PUBLISHER_URL = 'https://publisher.testnet.walrus.atalma.io';
  private readonly WALRUS_RETRIEVER_URL = 'https://aggregator.walrus-testnet.walrus.space';

  constructor(
    @InjectRepository(WalrusUpload)
    private readonly walrusRepo: Repository<WalrusUpload>,
  ) {}

  // ======================================================
  // 📤 Upload File to Walrus (NO CERTIFICATION NEEDED)
  // ======================================================
  async uploadFile(file: Express.Multer.File, maxRetries: number = 2) {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        this.logger.log(`📤 Uploading "${file.originalname}" to Walrus (attempt ${attempt})...`);
        
        // Long lifetime: 500 epochs (note: costs more "internal" WAL; try 1 for cheap tests)
        const epochs = 1; // Reduced for testing; increase once stable
        const uploadUrl = `${this.WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`;
        const res = await axios.put(uploadUrl, file.buffer, {
          headers: { 
            'Content-Type': file.mimetype,
            'User-Agent': 'NestJS-Walrus-Client/1.0', // Optional: Custom UA for tracking
          },
          timeout: 60000,
          validateStatus: () => true, // Allow non-200 to inspect errors
        });

        if (res.status !== 200) {
          throw new Error(
            `Walrus upload failed: ${res.status} - ${JSON.stringify(res.data || {})}`,
          );
        }

        const blobId = res.data?.newlyCreated?.blobObject?.blobId;
        if (!blobId) {
          throw new Error(`Missing blobId from Walrus response: ${JSON.stringify(res.data)}`);
        }

        // File can be retrieved from aggregator immediately (no cert wait)
        const retrieverUrl = `${this.WALRUS_RETRIEVER_URL}/v1/blobs/${blobId}`;

        // 💾 Save to DB
        const saved = await this.walrusRepo.save(
          this.walrusRepo.create({
            filename: file.originalname,
            contentType: file.mimetype,
            walrusId: blobId,
            remoteUrl: retrieverUrl,
            fullResponse: JSON.stringify(res.data),
          }),
        );

        this.logger.log(`✅ Uploaded → ${retrieverUrl} (Blob ID: ${blobId}, Epochs: ${epochs})`);
        return {
          success: true,
          blobId,
          url: retrieverUrl,
          saved,
        };
      } catch (error: any) {
        lastError = error;
        this.logger.error(`❌ Walrus Upload Error (attempt ${attempt}):`, error);

        // If it's the last attempt or not a retryable error (e.g., not network-related), throw
        if (attempt === maxRetries + 1 || !(error instanceof AxiosError && error.code === 'ECONNABORTED')) {
          throw new InternalServerErrorException(
            `Failed to upload to Walrus: ${error.message}`,
          );
        }

        // Wait a bit before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    // Fallback (shouldn't reach here)
    throw new InternalServerErrorException(`Failed after retries: ${lastError.message}`);
  }

  // ======================================================
  // 📁 CRUD
  // ======================================================
  async findAll() {
    return this.walrusRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const file = await this.walrusRepo.findOne({ where: { id } });
    if (!file)
      throw new InternalServerErrorException(`File with ID ${id} not found`);
    return file;
  }

  async remove(id: number) {
    const result = await this.walrusRepo.delete(id);
    if (result.affected === 0)
      throw new InternalServerErrorException('File not found or already deleted');
    return { deleted: true };
  }
}