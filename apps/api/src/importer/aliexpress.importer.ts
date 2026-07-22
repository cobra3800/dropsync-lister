import { Injectable } from '@nestjs/common';
import type { AmazonProduct } from './amazon.importer.js';

@Injectable()
export class AliexpressImporter {
  async import(url: string): Promise<AmazonProduct> {
    return {
      title: 'AliExpress Product',
      brand: '',
      price: 0,
      currency: 'USD',
      description: '',
      features: [],
      images: [],
      category: '',
      specifications: {
        sourceUrl: url,
      },
    };
  }
}