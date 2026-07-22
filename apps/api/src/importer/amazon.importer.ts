import { Injectable } from '@nestjs/common';

export type AmazonProduct = {
  title: string;
  brand?: string;
  price?: number;
  currency: string;
  description?: string;
  features: string[];
  images: string[];
  category?: string;
  specifications: Record<string, string>;
};

@Injectable()
export class AmazonImporter {
  async import(url: string): Promise<AmazonProduct> {
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