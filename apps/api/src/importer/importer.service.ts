import { BadRequestException, Injectable } from '@nestjs/common';
import { ImporterFactory } from './importer.factory.js';
import { randomUUID } from 'node:crypto';
import type { UniversalProduct } from '../core/universal-product.js';
import type {
  ImportedProduct,
  ProductSource,
} from './product.types.js';

@Injectable()
export class ImporterService {
  constructor(
    private readonly importerFactory: ImporterFactory,
  ) {}

  async importProduct(url: string): Promise<ImportedProduct> {
    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      throw new BadRequestException('Product URL is required');
    }

    try {
      new URL(normalizedUrl);
    } catch {
      throw new BadRequestException(
        'Please enter a valid product URL',
      );
    }

    const importer =
      this.importerFactory.getImporter(normalizedUrl);

    const product = await importer.import(normalizedUrl);

    return {
  ...product,
  source: this.detectSource(normalizedUrl),
  sourceUrl: normalizedUrl,
};
  }
async importUniversalProduct(url: string): Promise<UniversalProduct> {
  const product = await this.importProduct(url);

  return {
    id: randomUUID(),
    source: product.source,
    title: product.title,
    description: product.description,
    images: product.images,
    brand: product.brand || undefined,
    category: product.category || undefined,
    specifications: product.specifications,
    price: product.price,
    quantity: 1,
    condition: 'NEW',
  };
}
  private detectSource(url: string): ProductSource {
    const value = url.toLowerCase();

    if (value.includes('amazon.com')) {
      return 'amazon';
    }

    if (value.includes('walmart.com')) {
      return 'walmart';
    }

    if (value.includes('aliexpress.com')) {
      return 'aliexpress';
    }

    if (value.includes('ebay.com')) {
      return 'ebay';
    }

    return 'unknown';
  }
}