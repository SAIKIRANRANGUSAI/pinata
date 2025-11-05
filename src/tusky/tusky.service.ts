// src/tusky/tusky.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TuskyKey, TuskyImage } from '../entities/tusky.entity';
import { WalrusService } from '../walrus/walrus.service';
import { PinataService } from '../pinata/pinata.service';

@Injectable()
export class TuskyService {
  constructor(
    @InjectRepository(TuskyKey)
    private readonly keyRepo: Repository<TuskyKey>,

    @InjectRepository(TuskyImage)
    private readonly imageRepo: Repository<TuskyImage>,

    private readonly walrusService: WalrusService,
    private readonly pinataService: PinataService,
  ) {}

  // ----------------------------
  // 🔑 KEY MANAGEMENT
  // ----------------------------

  async createKey(keyData: Partial<TuskyKey>) {
    const key = this.keyRepo.create(keyData);
    return await this.keyRepo.save(key);
  }

  async findAllKeys() {
    return await this.keyRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findKey(id: number) {
    const key = await this.keyRepo.findOne({ where: { id } });
    if (!key) throw new InternalServerErrorException(`Key with ID ${id} not found`);
    return key;
  }

  async updateKey(id: number, updateData: Partial<TuskyKey>) {
    await this.keyRepo.update(id, updateData);
    return this.findKey(id);
  }

  async removeKey(id: number) {
    const result = await this.keyRepo.delete(id);
    if (result.affected === 0) {
      throw new InternalServerErrorException('Key not found or already deleted');
    }
    return { deleted: true };
  }

  // ✅ Fetch and store API response from Tusky/Mastodon server
  async fetchAndStoreApiResponse(keyId: number) {
    const key = await this.findKey(keyId);
    if (!key.serverUrl || !key.accessToken) {
      throw new InternalServerErrorException('Missing server URL or access token');
    }

    const response = await fetch(`${key.serverUrl}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${key.accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(`Tusky API error: ${errorText}`);
    }

    const apiResponse = await response.json();
    await this.updateKey(keyId, { apiResponse });
    return apiResponse;
  }

  // ----------------------------
  // 🖼️ IMAGE UPLOAD MANAGEMENT
  // ----------------------------

  async createImage(file: Express.Multer.File, storageType: 'walrus' | 'pinata') {
    try {
      let uploadResult: any;

      if (storageType === 'walrus') {
        uploadResult = await this.walrusService.uploadFile(file);
      } else {
        uploadResult = await this.pinataService.uploadFile(file);
      }

      const image = this.imageRepo.create({
        filename: file.originalname,
        mimeType: file.mimetype,
        storageType,
        remoteUrl: uploadResult.remoteUrl || uploadResult.url,
        uploadResponse: uploadResult,
      });

      const saved = await this.imageRepo.save(image);
      console.log(`✅ Uploaded ${file.originalname} via ${storageType}`);
      return saved;
    } catch (error: any) {
      console.error(`❌ Error uploading via ${storageType}:`, error.message || error);
      throw new InternalServerErrorException(
        `Failed to upload image via ${storageType}: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async findAllImages() {
    return await this.imageRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findImage(id: number) {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image)
      throw new InternalServerErrorException(`Image with ID ${id} not found`);
    return image;
  }

  async removeImage(id: number) {
    const result = await this.imageRepo.delete(id);
    if (result.affected === 0)
      throw new InternalServerErrorException('Image not found or already deleted');
    return { deleted: true };
  }
}
