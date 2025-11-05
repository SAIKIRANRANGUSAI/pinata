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
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
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
