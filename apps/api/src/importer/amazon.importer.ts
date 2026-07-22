import { Injectable } from '@nestjs/common';

import type { SupplierProduct } from './product.types.js';
 
@Injectable()
export class AmazonImporter {
  async import(url: string):  Promise<SupplierProduct>{
    const asin =
      url.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
      url.match(/\/gp\/product\/([A-Z0-9]{10})/)?.[1] ??
      'UNKNOWN';

    return {
      title: `Amazon Product ${asin}`,
      brand: '',
      price: 0,
      currency: 'USD',
      description: '',
      features: [],
      images: [],
      category: '',
      specifications: {},
    };
  }
}