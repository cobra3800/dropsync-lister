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
const specifications: Record<string, string> = {};
let description = '';
let brand = '';

$('script[type="application/ld+json"]').each((_, element) => {
  try {
    const raw = $(element).html();
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const nodes = Array.isArray(parsed) ? parsed : [parsed];

    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;

      const candidates = Array.isArray(node['@graph'])
        ? node['@graph']
        : [node];

      for (const candidate of candidates) {
        if (
          !candidate ||
          typeof candidate !== 'object' ||
          candidate['@type'] !== 'Product'
        ) {
          continue;
        }

        if (typeof candidate.description === 'string') {
          description = candidate.description.trim();
        }

        if (typeof candidate.brand === 'string') {
          brand = candidate.brand.trim();
        } else if (
          candidate.brand &&
          typeof candidate.brand.name === 'string'
        ) {
          brand = candidate.brand.name.trim();
        }

        const properties = candidate.additionalProperty;

        if (Array.isArray(properties)) {
          for (const property of properties) {
            if (
              property &&
              typeof property.name === 'string' &&
              property.value != null
            ) {
              const value =
                typeof property.value === 'string' ||
                typeof property.value === 'number'
                  ? String(property.value)
                  : '';

              if (value) {
                specifications[property.name.trim()] = value.trim();
              }
            }
          }
        }

        const addMeasurement = (
          name: string,
          measurement: unknown,
        ) => {
          if (typeof measurement === 'string') {
            specifications[name] = measurement.trim();
            return;
          }

          if (
            measurement &&
            typeof measurement === 'object'
          ) {
            const m = measurement as {
              value?: string | number;
              unitText?: string;
              unitCode?: string;
            };

            if (m.value != null) {
              specifications[name] = `${m.value}${
                m.unitText ? ` ${m.unitText}` : ''
              }`.trim();
            }
          }
        };

        addMeasurement('Width', candidate.width);
        addMeasurement('Height', candidate.height);
        addMeasurement('Depth', candidate.depth);
      }
    }
  } catch {
    // Ignore malformed structured-data blocks.
  }
});
return {
  title,
  brand,
  price,
  currency: 'USD',
  description,
  features: [],
  images,
  category: '',
  specifications,
};
  }
}