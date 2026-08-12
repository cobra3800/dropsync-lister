import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SupplierProduct } from './product.types.js';

@Injectable()
export class AmazonImporter {
  async import(url: string): Promise<SupplierProduct> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const priceText =
  $('.a-price .a-offscreen').first().text().trim() ||
  $('#corePriceDisplay_desktop_feature_div .a-offscreen').first().text().trim() ||
  '';

const price = Number(
  priceText.replace(/[^0-9.]/g, '')
) || 0;

const images = Array.from(
  $('img')
    .map((_, el) => {
      return (
        $(el).attr('data-old-hires') ||
        $(el).attr('data-a-dynamic-image') ||
        $(el).attr('src')
      );
    })
    .get(),
)
  .flatMap((value) => {
    if (!value) return [];

    if (value.trim().startsWith('{')) {
      try {
        return Object.keys(JSON.parse(value));
      } catch {
        return [];
      }
    }

    return [value];
  })
  .filter((src) => src.startsWith('http'))
.filter((src) => !src.includes('sprite'))
.filter((src) => !src.includes('icon'))
.filter((src) => !src.includes('logo'))
.filter((src) => !src.includes('marketing'))
.filter((src) => !src.includes('Prime'))
.filter((src) => !src.includes('transparent-pixel'))
.filter((src, index, list) => list.indexOf(src) === index)
.slice(0, 8);

const title =
  $('#productTitle').text().trim() ||
  $('title').text().trim() ||
  'Unknown Product';

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