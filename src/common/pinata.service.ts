import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';

import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PinataService {
  private readonly jwt = process.env.PINATA_JWT;
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
