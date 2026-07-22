import { Injectable } from '@nestjs/common';
import type { AmazonProduct } from './amazon.importer.js';

@Injectable()
export class WalmartImporter {
  async import(url: string): Promise<AmazonProduct> {
    return {
      title: 'Walmart Product',
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