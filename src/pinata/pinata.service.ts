import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinataUpload } from '../entities/pinata.entity';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class PinataService {
  constructor(
    @InjectRepository(PinataUpload)
    private readonly pinataRepo: Repository<PinataUpload>,
  ) {}

  /**
   * Upload file to Pinata Cloud (IPFS)
   */
  async uploadFile(file: Express.Multer.File) {
    try {
      const form = new FormData();
      form.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZWQyNjhkMy1kMmQyLTQzYjQtODcxNy0zOTUxMzY4NWJiNGMiLCJlbWFpbCI6InNhaWtpcmFuLmNtb29uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjNDY0ZGFkM2NiZjA4MWNkZWVmYyIsInNjb3BlZEtleVNlY3JldCI6Ijg2MzI1ODFhY2EzOGVmOGExMTFkZWQ1ODMxYzM2NGU0NTNlYWIxMTBjNWI5ZmIwMGFiYWIyZDM1NTA4ZjU1MjYiLCJleHAiOjE3OTM3NzE5NDl9.qdAqMgSVVwWxQF0_hWf8IIjbuULb6oUAvhZjBasCej8'`,
          },
        },
      );

      const data = response.data;

      if (!data?.IpfsHash) {
        throw new Error('Invalid Pinata response: missing IpfsHash');
      }

      // Save upload info to MySQL
      const upload = this.pinataRepo.create({
        filename: file.originalname,
        contentType: file.mimetype,
        cid: data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
        fullResponse: JSON.stringify(data),
      });

      const saved = await this.pinataRepo.save(upload);
      console.log(`✅ Uploaded ${file.originalname} → ${data.IpfsHash}`);
      return saved;
    } catch (error: any) {
      console.error('❌ Pinata upload failed:', error.message || error);
      throw new InternalServerErrorException(
        `Failed to upload file to Pinata: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async findAll() {
    return this.pinataRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const file = await this.pinataRepo.findOne({ where: { id } });
    if (!file) {
      throw new InternalServerErrorException(`File with ID ${id} not found`);
    }
    return file;
  }

  async remove(id: number) {
    const result = await this.pinataRepo.delete(id);
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        'File not found or already deleted',
      );
    }
    return { deleted: true };
  }
}

