import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

import type { SupplierProduct } from './product.types.js';

@Injectable()
export class AliexpressImporter {
  async import(url: string): Promise<SupplierProduct> {
    const parsedUrl = new URL(url);
    const itemIdMatch =
      parsedUrl.pathname.match(/\/item\/(\d+)\.html/i);

    if (!itemIdMatch) {
      throw new BadGatewayException(
        'Unable to find the AliExpress product ID in this URL',
      );
    }

    throw new BadGatewayException(
      'AliExpress direct importing is temporarily unavailable because AliExpress blocks server-side requests. Please use Amazon or Walmart for now.',
    );
  }
}