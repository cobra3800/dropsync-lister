import { Injectable } from '@nestjs/common';
import { EbayService } from './ebay.service.js';

@Injectable()
export class TaxonomyService {
  constructor(
    private readonly ebayService: EbayService,
  ) {}

  async suggestCategory(
    storeId: string,
    title: string,
  ) {
    const accessToken =
      await this.ebayService.refreshAccessToken(storeId);

    const response = await fetch(
      `https://api.sandbox.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${encodeURIComponent(
        title,
      )}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json() as {
      categorySuggestions?: unknown[];
    };

    return data.categorySuggestions ?? [];
  }
}