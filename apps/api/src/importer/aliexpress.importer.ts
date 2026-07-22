import { Injectable } from '@nestjs/common';

import type { SupplierProduct } from './product.types.js';

@Injectable()
export class AliexpressImporter {
  async import(url: string): Promise<SupplierProduct> {
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