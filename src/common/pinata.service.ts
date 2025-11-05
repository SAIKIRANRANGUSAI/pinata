import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class PinataService {
<<<<<<< HEAD
  private readonly jwt =
    process.env.PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZWQyNjhkMy1kMmQyLTQzYjQtODcxNy0zOTUxMzY4NWJiNGMiLCJlbWFpbCI6InNhaWtpcmFuLmNtb29uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjNDY0ZGFkM2NiZjA4MWNkZWVmYyIsInNjb3BlZEtleVNlY3JldCI6Ijg2MzI1ODFhY2EzOGVmOGExMTFkZWQ1ODMxYzM2NGU0NTNlYWIxMTBjNWI5ZmIwMGFiYWIyZDM1NTA4ZjU1MjYiLCJleHAiOjE3OTM3NzE5NDl9.qdAqMgSVVwWxQF0_hWf8IIjbuULb6oUAvhZjBasCej8'; // ✅ replace with your actual token or keep env var

=======
  private readonly jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZWQyNjhkMy1kMmQyLTQzYjQtODcxNy0zOTUxMzY4NWJiNGMiLCJlbWFpbCI6InNhaWtpcmFuLmNtb29uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjNDY0ZGFkM2NiZjA4MWNkZWVmYyIsInNjb3BlZEtleVNlY3JldCI6Ijg2MzI1ODFhY2EzOGVmOGExMTFkZWQ1ODMxYzM2NGU0NTNlYWIxMTBjNWI5ZmIwMGFiYWIyZDM1NTA4ZjU1MjYiLCJleHAiOjE3OTM3NzE5NDl9.qdAqMgSVVwWxQF0_hWf8IIjbuULb6oUAvhZjBasCej8';
>>>>>>> 22d4c8504839acf95c4908c72d9567a65d60315c
  private readonly baseUrl = 'https://api.pinata.cloud/pinning';

  // ✅ Upload Buffer (for Multer memoryStorage)
  async uploadBufferToPinata(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, { filename: file.originalname });

      const res = await axios.post(`${this.baseUrl}/pinFileToIPFS`, formData, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          ...formData.getHeaders(),
        },
      });

      const cid = res.data?.IpfsHash;
      if (!cid) throw new Error('Invalid Pinata response');

      return {
        cid,
        url: `https://gateway.pinata.cloud/ipfs/${cid}`,
        timestamp: new Date().toISOString(), // ✅ fix #1
      };
    } catch (err: any) {
      console.error('❌ uploadBufferToPinata failed:', err.response?.data || err.message);
      throw new InternalServerErrorException('Failed to upload file to Pinata');
    }
  }

  // ✅ Upload File Path (for diskStorage)
  async uploadToPinata(filePath: string) {
    try {
      const formData = new FormData();
      formData.append('file', filePath);

      const res = await axios.post(`${this.baseUrl}/pinFileToIPFS`, formData, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          ...formData.getHeaders(),
        },
      });

      const cid = res.data?.IpfsHash;
      if (!cid) throw new Error('Invalid Pinata response');

      return {
        cid,
        url: `https://gateway.pinata.cloud/ipfs/${cid}`,
        timestamp: new Date().toISOString(), // ✅ fix #2
      };
    } catch (err: any) {
      console.error('❌ uploadToPinata failed:', err.response?.data || err.message);
      throw new InternalServerErrorException('Failed to upload file to Pinata');
    }
  }

  // ✅ Delete by CID
  async deleteFromPinata(cid: string) {
    try {
      const res = await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${cid}`,
        {
          headers: { Authorization: `Bearer ${this.jwt}` },
        },
      );

      if (res.status === 200) {
        console.log(`🗑️ Deleted from Pinata: ${cid}`);
        return { success: true, cid };
      } else {
        throw new Error(`Unexpected Pinata response: ${res.status}`);
      }
    } catch (err: any) {
      console.error('❌ deleteFromPinata failed:', err.response?.data || err.message);
      throw new InternalServerErrorException('Failed to delete file from Pinata');
    }
  }
}

