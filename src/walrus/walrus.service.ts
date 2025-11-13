import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalrusUpload } from '../entities/walrus.entity';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

@Injectable()
export class WalrusService {
  private readonly WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space';
  private readonly WALRUS_RETRIEVER_URL = 'https://aggregator.walrus-testnet.walrus.space';

  constructor(
    @InjectRepository(WalrusUpload)
    private readonly walrusRepo: Repository<WalrusUpload>,
  ) {
    console.log(`🔗 Walrus Publisher: ${this.WALRUS_PUBLISHER_URL}`);
    console.log(`🔗 Walrus Retriever: ${this.WALRUS_RETRIEVER_URL}`);
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      console.log(`📤 Uploading "${file.originalname}" to Walrus Testnet...`);

      // ✅ Use PUT (not POST) and include query params
      const uploadUrl = `${this.WALRUS_PUBLISHER_URL}/v1/blobs?epochs=1`;
      console.log(`📡 Upload endpoint: ${uploadUrl}`);

      const res = await axios.put(uploadUrl, file.buffer, {
        headers: {
          'Content-Type': file.mimetype,
        },
        timeout: 30000,
        validateStatus: () => true,
      });

      console.log(`📡 Walrus response status: ${res.status}`);
      console.log(`📡 Walrus response data:`, res.data);

      if (res.status !== 200) {
        throw new Error(`Walrus upload failed: ${res.status} - ${JSON.stringify(res.data || '')}`);
      }

      const blobId = res.data?.newlyCreated?.blobObject?.blobId;
      if (!blobId) throw new Error('❌ Invalid Walrus response: missing blobId');

      console.log(`🆔 Blob ID: ${blobId}`);

      const retrieverUrl = `${this.WALRUS_RETRIEVER_URL}/v1/blobs/${blobId}`;
      console.log(`🌐 Retriever URL: ${retrieverUrl}`);

      // 💾 Save record to DB
      const upload = this.walrusRepo.create({
        filename: file.originalname,
        contentType: file.mimetype,
        walrusId: blobId,
        remoteUrl: retrieverUrl,
        fullResponse: JSON.stringify(res.data),
      });

      const saved = await this.walrusRepo.save(upload);
      console.log(`✅ Successfully uploaded "${file.originalname}" → ${retrieverUrl}`);

      return {
        success: true,
        message: 'Uploaded successfully to Walrus Testnet',
        blobId,
        retrieverUrl,
        saved,
      };
    } catch (error: any) {
      console.error('❌ Walrus Upload Error:', error);

      let errorMsg = error.message || 'Unknown error';
      if (axios.isAxiosError(error)) {
        errorMsg = `Axios error: ${error.code || 'N/A'} - ${
          error.response?.status || 'No response'
        } - ${
          error.response?.data ? JSON.stringify(error.response.data) : error.message
        }`;
      }

      throw new InternalServerErrorException(`Failed to upload to Walrus: ${errorMsg}`);
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
