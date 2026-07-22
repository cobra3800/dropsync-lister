import { BadRequestException, Injectable } from '@nestjs/common';

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
  async importProduct(url: string): Promise<ImportedProduct> {
    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      throw new BadRequestException('Product URL is required');
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      throw new BadRequestException('Please enter a valid product URL');
    }

    const source = this.detectSource(parsedUrl.hostname);

    return {
      source,
      sourceUrl: normalizedUrl,
      title: this.buildTemporaryTitle(source, normalizedUrl),
      currency: 'USD',
      features: [],
      images: [],
      specifications: {},
    };
  }

  private detectSource(
    hostname: string,
  ): ImportedProduct['source'] {
    const host = hostname.toLowerCase();

    if (host.includes('amazon.')) return 'amazon';
    if (host.includes('walmart.')) return 'walmart';
    if (host.includes('ebay.')) return 'ebay';
    if (host.includes('aliexpress.')) return 'aliexpress';

    return 'unknown';
  }

  private buildTemporaryTitle(
    source: ImportedProduct['source'],
    url: string,
  ): string {
    if (source === 'amazon') {
      const asin = this.extractAmazonAsin(url);

      if (asin) {
        return `Amazon Product ${asin}`;
      }
    }

    return `${source === 'unknown' ? 'Supplier' : source} product`;
  }

  private extractAmazonAsin(url: string): string | null {
    const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);

    return match?.[1]?.toUpperCase() ?? null;
  }
}