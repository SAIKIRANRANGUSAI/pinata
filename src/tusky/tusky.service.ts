import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TuskyKey, TuskyImage } from '../entities/tusky.entity';
import { WalrusService } from '../walrus/walrus.service';
import { PinataService } from '../pinata/pinata.service';

interface WalrusUpload {
  remoteUrl?: string;
  url?: string; // ✅ added this to fix TS2339 error
  cid?: string;
  [key: string]: any;
}

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

  // -----------------------------------
  // 🔑 KEY MANAGEMENT
  // -----------------------------------

  async createKey(keyData: Partial<TuskyKey>) {
    const key = this.keyRepo.create(keyData);
    return await this.keyRepo.save(key);
  }

  async findAllKeys() {
    return this.keyRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findKey(id: number) {
    const key = await this.keyRepo.findOne({ where: { id } });
    if (!key) throw new NotFoundException(`Tusky key with ID ${id} not found`);
    return key;
  }

  async updateKey(id: number, updateData: Partial<TuskyKey>) {
    await this.keyRepo.update(id, updateData);
    return this.findKey(id);
  }

  async removeKey(id: number) {
    const result = await this.keyRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Key not found or already deleted');
    }
    return { deleted: true };
  }

  /**
   * ✅ Fetch Mastodon API credentials using a stored Tusky key
   */
  async fetchAndStoreApiResponse(keyId: number) {
    const key = await this.findKey(keyId);
    if (!key.serverUrl || !key.accessToken) {
      throw new InternalServerErrorException(
        'Missing server URL or access token',
      );
    }

    const response = await fetch(
      `${key.serverUrl}/api/v1/accounts/verify_credentials`,
      {
        headers: { Authorization: `Bearer ${key.accessToken}` },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(`Tusky API error: ${errorText}`);
    }

    const apiResponse = await response.json();
    await this.updateKey(keyId, { apiResponse });
    return apiResponse;
  }

  // -----------------------------------
  // 🖼️ IMAGE UPLOAD MANAGEMENT
  // -----------------------------------

  /**
   * Upload image to Walrus by default (Tusky → Walrus)
   */
  async uploadToWalrus(file: Express.Multer.File) {
    try {
      if (!file) throw new Error('No file received for upload');

      console.log(`🚀 Uploading ${file.originalname} to Walrus via TuskyService...`);

      const uploadResult: WalrusUpload = await this.walrusService.uploadFile(file);

      const newImage = this.imageRepo.create({
        filename: file.originalname,
        mimeType: file.mimetype,
        storageType: 'walrus',
        remoteUrl:
          uploadResult.remoteUrl ??
          uploadResult.url ??
          '', // ✅ Safe access
        uploadResponse: uploadResult,
      });

      const saved = await this.imageRepo.save(newImage);
      console.log(`✅ Uploaded ${file.originalname} → Walrus`);
      return saved;
    } catch (error: any) {
      console.error('❌ Tusky → Walrus upload failed:', error.message || error);
      throw new InternalServerErrorException(
        `Failed to upload file to Walrus: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Optional — Upload image to Pinata (if needed in future)
   */
  async uploadToPinata(file: Express.Multer.File) {
    try {
      if (!file) throw new Error('No file received for upload');

      console.log(`🚀 Uploading ${file.originalname} to Pinata via TuskyService...`);

      const uploadResult = await this.pinataService.uploadFile(file);

      const newImage = this.imageRepo.create({
        filename: file.originalname,
        mimeType: file.mimetype,
        storageType: 'pinata',
        remoteUrl: uploadResult.url ?? '', // ✅ Safe null check
        uploadResponse: uploadResult,
      });

      const saved = await this.imageRepo.save(newImage);
      console.log(`✅ Uploaded ${file.originalname} → Pinata`);
      return saved;
    } catch (error: any) {
      console.error('❌ Tusky → Pinata upload failed:', error.message || error);
      throw new InternalServerErrorException(
        `Failed to upload file to Pinata: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Legacy (backward compatible) — createImage chooses based on storageType
   */
  async createImage(
    file: Express.Multer.File,
    storageType: 'walrus' | 'pinata',
  ) {
    if (storageType === 'walrus') {
      return this.uploadToWalrus(file);
    } else {
      return this.uploadToPinata(file);
    }
  }

  /**
   * Retrieve all uploaded images (latest first)
   */
  async findAllImages() {
    return this.imageRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Retrieve one image by ID
   */
  async findImage(id: number) {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) throw new NotFoundException(`Image with ID ${id} not found`);
    return image;
  }

  /**
   * Delete image record (not from storage)
   */
  async removeImage(id: number) {
    const result = await this.imageRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Image not found or already deleted');
    }
    console.log(`🗑️ Deleted Tusky image ID: ${id}`);
    return { deleted: true };
  }
}
