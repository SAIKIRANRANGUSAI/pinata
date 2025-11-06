import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinataUpload } from '../entities/pinata.entity';
import axios from 'axios';
import FormData from 'form-data'; // ✅ fixed import


@Injectable()
export class PinataService {
  constructor(
    @InjectRepository(PinataUpload)
    private readonly pinataRepo: Repository<PinataUpload>,
  ) {}

  // ✅ Direct Pinata JWT (your valid key)
  private readonly pinataJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZWQyNjhkMy1kMmQyLTQzYjQtODcxNy0zOTUxMzY4NWJiNGMiLCJlbWFpbCI6InNhaWtpcmFuLmNtb29uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjNDY0ZGFkM2NiZjA4MWNkZWVmYyIsInNjb3BlZEtleVNlY3JldCI6Ijg2MzI1ODFhY2EzOGVmOGExMTFkZWQ1ODMxYzM2NGU0NTNlYWIxMTBjNWI5ZmIwMGFiYWIyZDM1NTA4ZjU1MjYiLCJleHAiOjE3OTM3NzE5NDl9.qdAqMgSVVwWxQF0_hWf8IIjbuULb6oUAvhZjBasCej8';

  // ✅ Base URL for Pinata API
  private readonly pinataUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

  /**
   * Upload file to Pinata Cloud (IPFS)
   */
  async uploadFile(file: Express.Multer.File) {
    try {
      if (!file) throw new Error('No file received.');

      // Create multipart form
      const form = new FormData();
      form.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Make upload request to Pinata
      const response = await axios.post(this.pinataUrl, form, {
        maxBodyLength: Infinity,
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.pinataJwt}`, // ✅ no quotes inside
        },
      });

      const data = response.data;
      if (!data?.IpfsHash) {
        throw new Error('Invalid Pinata response: missing IpfsHash.');
      }

      // Save upload record in MySQL
      const newUpload = this.pinataRepo.create({
        filename: file.originalname,
        contentType: file.mimetype,
        cid: data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
        fullResponse: JSON.stringify(data),
      });

      const saved = await this.pinataRepo.save(newUpload);
      console.log(`✅ Uploaded ${file.originalname} → ${data.IpfsHash}`);

      return saved;
    } catch (error: any) {
      console.error(
        '❌ Pinata upload failed:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        `Failed to upload file to Pinata: ${
          error.response?.data?.error || error.message || 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get all uploaded files (sorted)
   */
  async findAll() {
    return this.pinataRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Get a single file by ID
   */
  async findOne(id: number) {
    const file = await this.pinataRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  /**
   * Delete file record from DB (not from IPFS)
   */
  async remove(id: number) {
    const result = await this.pinataRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('File not found or already deleted.');
    }
    console.log(`🗑️ Deleted file ID: ${id}`);
    return { deleted: true };
  }
}
