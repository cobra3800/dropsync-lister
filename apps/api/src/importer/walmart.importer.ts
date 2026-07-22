import { Injectable } from '@nestjs/common';

import type { SupplierProduct } from './product.types.js';

@Injectable()
export class WalmartImporter {
  async import(url: string): Promise<SupplierProduct> {
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