import { Injectable } from '@nestjs/common';
import { EbayService } from './ebay.service.js';

type EbayAspectValue = {
  localizedValue?: string;
};

type EbayAspect = {
  localizedAspectName?: string;
  aspectConstraint?: {
    aspectRequired?: boolean;
    aspectUsage?: string;
    itemToAspectCardinality?: string;
  };
  aspectValues?: EbayAspectValue[];
};

type EbayAspectsResponse = {
  aspects?: EbayAspect[];
};

@Injectable()
export class AspectsService {
  constructor(
    private readonly ebayService: EbayService,
  ) {}

  async getCategoryAspects(
    storeId: string,
    categoryId: string,
  ) {
    const accessToken =
      await this.ebayService.refreshAccessToken(storeId);

    const response = await fetch(
      `https://api.sandbox.ebay.com/commerce/taxonomy/v1/category_tree/0/get_item_aspects_for_category?category_id=${encodeURIComponent(
        categoryId,
      )}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Accept-Language': 'en-US',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      },
    );

    const data = (await response.json()) as EbayAspectsResponse & {
      errors?: Array<{
        message?: string;
        longMessage?: string;
      }>;
    };

    if (!response.ok) {
      throw new Error(
        data.errors?.[0]?.longMessage ??
          data.errors?.[0]?.message ??
          'Unable to load eBay category aspects',
      );
    }

    const aspects = data.aspects ?? [];

    return aspects.map((aspect) => ({
      name: aspect.localizedAspectName ?? '',
      required:
        aspect.aspectConstraint?.aspectRequired === true,
      usage:
        aspect.aspectConstraint?.aspectUsage ?? 'OPTIONAL',
      cardinality:
        aspect.aspectConstraint?.itemToAspectCardinality ??
        'SINGLE',
      values:
        aspect.aspectValues
          ?.map((value) => value.localizedValue)
          .filter(
            (value): value is string =>
              Boolean(value),
          ) ?? [],
    }));
  }
}