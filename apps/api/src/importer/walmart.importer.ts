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

const priceText =
  $('[itemprop="price"]').attr('content') ||
  $('[itemprop="price"]').first().text() ||
  $('meta[property="product:price:amount"]').attr('content') ||
  $('meta[itemprop="price"]').attr('content') ||
  '';

const priceMatch = priceText.match(/[\d,.]+/);

const price = priceMatch
  ? Number(priceMatch[0].replace(/,/g, ''))
  : 0;

const images = Array.from(
  new Set(
    [
      $('meta[property="og:image"]').attr('content'),
      $('meta[name="twitter:image"]').attr('content'),
      ...$('img')
        .map((_, element) => {
          const image =
            $(element).attr('src') ||
            $(element).attr('data-src') ||
            $(element).attr('data-image-src');

          return image;
        })
        .get(),
    ].filter(
      (image): image is string =>
        typeof image === 'string' &&
        image.startsWith('http') &&
        !image.includes('placeholder'),
    ),
  ),
).slice(0, 12);

return {
  title,
  brand: '',
  price,
  currency: 'USD',
  description: '',
  features: [],
  images,
  category: '',
  specifications: {},
};
  }
}