import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';

import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PinataService {
  private readonly jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZWQyNjhkMy1kMmQyLTQzYjQtODcxNy0zOTUxMzY4NWJiNGMiLCJlbWFpbCI6InNhaWtpcmFuLmNtb29uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjNDY0ZGFkM2NiZjA4MWNkZWVmYyIsInNjb3BlZEtleVNlY3JldCI6Ijg2MzI1ODFhY2EzOGVmOGExMTFkZWQ1ODMxYzM2NGU0NTNlYWIxMTBjNWI5ZmIwMGFiYWIyZDM1NTA4ZjU1MjYiLCJleHAiOjE3OTM3NzE5NDl9.qdAqMgSVVwWxQF0_hWf8IIjbuULb6oUAvhZjBasCej8';
  private readonly baseUrl = 'https://api.pinata.cloud/pinning';

  async uploadToPinata(filePath: string) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const res = await axios.post(`${this.baseUrl}/pinFileToIPFS`, formData, {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Bearer ${this.jwt}`,
        ...formData.getHeaders(),
      },
    });

    return {
      cid: res.data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
      timestamp: new Date().toISOString(),
    };
  }

  async deleteFromPinata(cid: string) {
    return axios.delete(`${this.baseUrl}/unpin/${cid}`, {
      headers: { Authorization: `Bearer ${this.jwt}` },
    });
  }
}

