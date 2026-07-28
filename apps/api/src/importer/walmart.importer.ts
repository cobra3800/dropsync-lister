import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SupplierProduct } from './product.types.js';

@Injectable()
export class WalmartImporter {
  async import(url: string): Promise<SupplierProduct> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    const title =
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      'Unknown Walmart Product';

    return {
      title,
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