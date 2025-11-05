import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalrusUpload } from '../entities/walrus.entity';
import * as dotenv from 'dotenv';
import axios from 'axios'; // npm i axios

dotenv.config();

@Injectable()
export class WalrusService {
  // Use env vars for flexibility (fallbacks to correct testnet URLs per official docs)
  private readonly WALRUS_PUBLISHER_URL = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
  private readonly WALRUS_AGGREGATOR_URL = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

  constructor(
    @InjectRepository(WalrusUpload)
    private readonly walrusRepo: Repository<WalrusUpload>,
  ) {
    console.log(`🔗 Using Walrus Publisher URL: ${this.WALRUS_PUBLISHER_URL}`);
    console.log(`🔗 Using Walrus Aggregator URL: ${this.WALRUS_AGGREGATOR_URL}`);
  }

  /**
   * Upload file directly to Walrus Testnet using official HTTP Publisher API
   */
  async uploadFile(file: Express.Multer.File) {
    try {
      console.log(`📤 Uploading ${file.originalname} to Walrus Testnet...`);

      // 1️⃣ STEP 1 — Direct PUT to /v1/blobs (generates blobId in response)
      const uploadUrl = `${this.WALRUS_PUBLISHER_URL}/v1/blobs`;
      console.log(`📤 Uploading to: ${uploadUrl}`);

      // Optional query params: e.g., ?permanent=true&epochs=1 (defaults: deletable, epochs=1)
      const res = await axios.put(uploadUrl, file.buffer, {
        headers: {
          'Content-Type': file.mimetype,
        },
        timeout: 30000, // 30s for upload
        validateStatus: () => true,
      });

      console.log(`📡 Upload status: ${res.status}`);
      console.log(`📡 Upload response:`, res.data || 'Success (no body)');

      if (res.status !== 200) {
        throw new Error(`Walrus upload failed: ${res.status} - ${JSON.stringify(res.data)}`);
      }

      // Extract blobId from response (newlyCreated.blobObject.blobId)
      const { newlyCreated } = res.data;
      if (!newlyCreated || !newlyCreated.blobObject) {
        throw new Error('Invalid response: No blobObject in newlyCreated');
      }
      const blobId = newlyCreated.blobObject.blobId;

      if (!blobId) throw new Error('No blobId returned from Walrus');

      console.log(`🆔 New blob ID: ${blobId}`);

      // 2️⃣ STEP 2 — Save to DB
      const upload = this.walrusRepo.create({
        filename: file.originalname,
        contentType: file.mimetype,
        walrusId: blobId,
        remoteUrl: `${this.WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`,
        fullResponse: JSON.stringify(res.data),
      });

      const saved = await this.walrusRepo.save(upload);
      console.log(`✅ Uploaded ${file.originalname} → Blob ID: ${blobId}`);
      return saved;
    } catch (error: any) {
      console.error('❌ Full error details:', error);
      let errorMsg = error.message || 'Unknown error';
      if (axios.isAxiosError(error)) {
        errorMsg = `Axios error: ${error.code || 'N/A'} - ${error.response?.status || 'No response'} - ${error.response?.data || error.message}`;
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          errorMsg += ' (Check network/DNS/firewall)';
        } else if (error.code === 'ETIMEDOUT') {
          errorMsg += ' (Timeout - slow connection)';
        } else if (error.code === 'EPROTO') {
          errorMsg += ' (Protocol error - possible HTTPS/TLS issue)';
        }
      }
      throw new InternalServerErrorException(
        `Failed to upload to Walrus: ${errorMsg}`,
      );
    }
  }

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