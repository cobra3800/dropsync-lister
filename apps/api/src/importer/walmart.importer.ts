import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SupplierProduct } from './product.types.js';

@Injectable()
export class WalmartImporter {
  async import(url: string): Promise<SupplierProduct> {
    console.log('WALMART IMPORTER CALLED:', url);
    const response = await axios.get(url, {
      headers: {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
},
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
console.log('WALMART HTML LENGTH:', response.data.length);
console.log('WALMART NEXT DATA:', $('script#__NEXT_DATA__').length);
const nextDataText = $('script#__NEXT_DATA__').html();

if (nextDataText) {
  const nextData = JSON.parse(nextDataText);

  console.log(
    'WALMART NEXT DATA KEYS:',
    Object.keys(nextData.props?.pageProps || {})
  );
  console.log(
  'WALMART INITIAL DATA KEYS:',
  Object.keys(nextData.props?.pageProps?.initialData || {})
);
console.log(
  'WALMART DATA KEYS:',
  Object.keys(nextData.props?.pageProps?.initialData?.data || {})
);
console.log(
  'WALMART PRODUCT KEYS:',
  Object.keys(
    nextData.props?.pageProps?.initialData?.data?.product || {}
  )
);
console.log(
  'WALMART STOCK KEYS:',
  Object.keys(
    nextData.props?.pageProps?.initialData?.data?.product || {}
  ).filter((key) =>
    /stock|availability|fulfill|offer|inventory|shipping/i.test(key)
  )
);
console.log(
  'WALMART FULFILLMENT SUMMARY:',
  JSON.stringify(
    nextData.props?.pageProps?.initialData?.data?.product
      ?.fulfillmentSummary ?? null,
    null,
    2
  )
);
console.log(
  'WALMART AVAILABILITY:',
  JSON.stringify(
    nextData.props?.pageProps?.initialData?.data?.product
      ?.availabilityStatus ?? null,
    null,
    2
  )
);
}
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
let category = '';
let availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN' = 'UNKNOWN';
const walmartAvailability =
  $('script#__NEXT_DATA__').length
    ? JSON.parse($('script#__NEXT_DATA__').html() || '{}')
        ?.props?.pageProps?.initialData?.data?.product
        ?.availabilityStatus
    : undefined;
console.log(
  'WALMART BRAND FIELDS:',
  Object.entries(
    JSON.parse($('script#__NEXT_DATA__').html() || '{}')
      ?.props?.pageProps?.initialData?.data?.product || {}
  ).filter(([key]) => key.toLowerCase().includes('category'))
);
const walmartProduct = JSON.parse(
  $('script#__NEXT_DATA__').html() || '{}'
)?.props?.pageProps?.initialData?.data?.product;
console.log(
  'WALMART CATEGORY PATH:',
  JSON.stringify(walmartProduct?.category?.path, null, 2)
);
if (typeof walmartProduct?.brand === 'string') {
  brand = walmartProduct.brand.trim();
}
const walmartCategoryPath = walmartProduct?.category?.path;

if (Array.isArray(walmartCategoryPath)) {
  const lastCategory = walmartCategoryPath[walmartCategoryPath.length - 1];

  if (typeof lastCategory?.name === 'string') {
    category = lastCategory.name.trim();
  }
}
if (walmartAvailability === 'IN_STOCK') {
  availability = 'IN_STOCK';
} else if (walmartAvailability === 'OUT_OF_STOCK') {
  availability = 'OUT_OF_STOCK';
}
{
  console.log(
  'WALMART JSON-LD SCRIPT COUNT:',
  $('script[type="application/ld+json"]').length
);
$('script[type="application/ld+json"]').each((_, element) => {
  try {
    const raw = $(element).html();
    console.log('WALMART JSON-LD CONTENT:', raw?.slice(0, 1500));
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
console.log('WALMART BRAND DATA:', candidate.brand);
        if (!brand && typeof candidate.brand === 'string') {
          brand = candidate.brand.trim();
        } else if (!brand &&
          candidate.brand &&
          typeof candidate.brand.name === 'string'
        ) {
          brand = candidate.brand.name.trim();
        }
        console.log('WALMART PRODUCT OFFERS:', JSON.stringify(candidate.offers, null, 2));
const offers = Array.isArray(candidate.offers)
  ? candidate.offers
  : candidate.offers
    ? [candidate.offers]
    : [];

for (const offer of offers) {
  if (!offer || typeof offer !== 'object') continue;
console.log('WALMART OFFER DATA:', JSON.stringify(offer, null, 2));
  const stock = String(
  offer.availability ||
  offer.availabilityStatus ||
  offer.stockStatus ||
  ''
).toLowerCase();

  if (stock.includes('outofstock') || stock.includes('soldout')) {
    availability = 'OUT_OF_STOCK';
    break;
  }

  if (stock.includes('instock') || stock.includes('limitedavailability')) {
    availability = 'IN_STOCK';
  }
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

}

return {
  title,
  brand,
  price,
  currency: 'USD',
  description,
  features: [],
  images,
  category,
  specifications,
  availability,
};
  }
}