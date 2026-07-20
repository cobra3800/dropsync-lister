import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EbayService } from './ebay.service.js';
import { EbayAccountRepository } from './repositories/ebay-account.repository.js';

export type CreateOfferInput = {
  storeId: string;
  sku: string;
  marketplaceId?: string;
  format?: string;
  availableQuantity: number;
  categoryId: string;
  merchantLocationKey: string;
  price: number;
  currency?: string;
  fulfillmentPolicyId: string;
  paymentPolicyId: string;
  returnPolicyId: string;
};

@Injectable()
export class OfferService {
  constructor(
    private readonly ebayAccountRepository: EbayAccountRepository,
    private readonly ebayService: EbayService,
  ) {}

  async createOffer(input: CreateOfferInput) {
    const {
      storeId,
      sku,
      marketplaceId = 'EBAY_US',
      format = 'FIXED_PRICE',
      availableQuantity,
      categoryId,
      merchantLocationKey,
      price,
      currency = 'USD',
      fulfillmentPolicyId,
      paymentPolicyId,
      returnPolicyId,
    } = input;

    if (
      !storeId ||
      !sku ||
      !categoryId ||
      !merchantLocationKey ||
      !fulfillmentPolicyId ||
      !paymentPolicyId ||
      !returnPolicyId
    ) {
      throw new BadRequestException(
        'storeId, sku, categoryId, merchantLocationKey, fulfillmentPolicyId, paymentPolicyId, and returnPolicyId are required',
      );
    }

    if (!Number.isInteger(availableQuantity) || availableQuantity < 1) {
      throw new BadRequestException(
        'availableQuantity must be a whole number of at least 1',
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException(
        'price must be greater than 0',
      );
    }

    const account =
      await this.ebayAccountRepository.findByStore(storeId);

    if (!account?.accessToken) {
      throw new NotFoundException(
        'No connected eBay account was found for this store.',
      );
    }

    let accessToken = account.accessToken;

    if (!account.expiresAt || account.expiresAt <= new Date()) {
      accessToken =
        await this.ebayService.refreshAccessToken(storeId);
    }

    const response = await fetch(
  'https://api.sandbox.ebay.com/sell/inventory/v1/offer',
  {
    method: 'POST',
    headers: {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Accept-Language': 'en-US',
  'Content-Language': 'en-US',
},
    body: JSON.stringify({
      sku,
      marketplaceId,
      format,
      availableQuantity,
      categoryId,
      merchantLocationKey,
      pricingSummary: {
        price: {
          value: price.toFixed(2),
          currency,
        },
      },
      listingPolicies: {
        fulfillmentPolicyId,
        paymentPolicyId,
        returnPolicyId,
      },
    }),
  },
);

const ebayResult = await response.json();

if (!response.ok) {
  throw new BadRequestException({
    message: 'Unable to create eBay offer',
    ebayError: ebayResult,
  });
}

return ebayResult;
}
async publishOffer(input: {
  storeId: string;
  offerId: string;
}) {
  const account =
    await this.ebayAccountRepository.findByStore(input.storeId);

  if (!account?.accessToken) {
    throw new NotFoundException('No connected eBay account found.');
  }

  const response = await fetch(
    `https://api.sandbox.ebay.com/sell/inventory/v1/offer/${input.offerId}/publish`,
    {
      method: 'POST',
    headers: {
  Authorization: `Bearer ${account.accessToken}`,
  Accept: 'application/json',
  'Accept-Language': 'en-US',
  'Content-Language': 'en-US',
      },
    },
  );

  const ebayResult = await response.json();

  if (!response.ok) {
    throw new BadRequestException(ebayResult);
  }

  return ebayResult;
}
}

