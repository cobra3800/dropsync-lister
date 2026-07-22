import { BadRequestException, Injectable } from '@nestjs/common';
import { ImporterFactory } from './importer.factory.js';
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
      source: this.detectSource(normalizedUrl),
      sourceUrl: normalizedUrl,
      ...product,
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