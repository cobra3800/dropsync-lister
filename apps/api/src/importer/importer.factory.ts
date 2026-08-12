import { Injectable, BadRequestException } from '@nestjs/common';
import { AmazonImporter } from './amazon.importer.js';
import { WalmartImporter } from './walmart.importer.js';
import { AliexpressImporter } from './aliexpress.importer.js';

@Injectable()
export class ImporterFactory {
  constructor(
    private readonly amazonImporter: AmazonImporter,
    private readonly walmartImporter: WalmartImporter,
    private readonly aliexpressImporter: AliexpressImporter,
  ) {}

  getImporter(url: string) {
  const hostname = new URL(url).hostname;

  if (url.includes('amazon.com')) {
    return this.amazonImporter;
  }

  if (url.includes('walmart.com')) {
    return this.walmartImporter;
  }

  if (
    hostname === 'aliexpress.com' ||
    hostname.endsWith('.aliexpress.com') ||
    hostname === 'aliexpress.us' ||
    hostname.endsWith('.aliexpress.us')
  ) {
    return this.aliexpressImporter;
  }

  throw new BadRequestException('Unsupported supplier');
}
}