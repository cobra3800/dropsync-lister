import { BadRequestException, Injectable } from '@nestjs/common';
import { ImporterFactory } from './importer.factory.js';

export type ImportedProduct = {
  source: 'amazon' | 'walmart' | 'ebay' | 'aliexpress' | 'unknown';
  sourceUrl: string;
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
      throw new BadRequestException('Please enter a valid product URL');
    }

    const importer = this.importerFactory.getImporter(normalizedUrl);
    const product = await importer.import(normalizedUrl);

    return {
      source: this.detectSource(normalizedUrl),
      sourceUrl: normalizedUrl,
      ...product,
    };
  }

  private detectSource(
    url: string,
  ): ImportedProduct['source'] {
    const value = url.toLowerCase();

    if (value.includes('amazon.com')) return 'amazon';
    if (value.includes('walmart.com')) return 'walmart';
    if (value.includes('ebay.com')) return 'ebay';
    if (value.includes('aliexpress.com')) return 'aliexpress';

    return 'unknown';
  }
}