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
console.log('EBAY CATEGORY QUERY TITLE:', title);
const treeResponse = await fetch(
  'https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  },
);

if (!treeResponse.ok) {
  throw new Error(await treeResponse.text());
}

const treeData = (await treeResponse.json()) as {
  categoryTreeId: string;
};

console.log('EBAY CATEGORY TREE ID:', treeData.categoryTreeId);
    const response = await fetch(
  `https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeData.categoryTreeId}/get_category_suggestions?q=${encodeURIComponent(title)}`,
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