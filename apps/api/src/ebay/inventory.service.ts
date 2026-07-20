import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EbayService } from './ebay.service.js';
import { EbayAccountRepository } from './repositories/ebay-account.repository.js';
import type { CreateLocationInput } from './location.dto.js';

export type CreateInventoryItemInput = {
  storeId: string;
  sku: string;
  title: string;
  description: string;
  quantity: number;
  condition?: string;
  imageUrls?: string[];
  brand?: string;
  mpn?: string;
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly ebayAccountRepository: EbayAccountRepository,
    private readonly ebayService: EbayService,
  ) {}

  async createInventoryItem(input: CreateInventoryItemInput) {
    const {
      storeId,
      sku,
      title,
      description,
      quantity,
      condition = 'NEW',
      imageUrls = [],
      brand = 'Unbranded',
      mpn = 'Does Not Apply',
    } = input;

    if (!storeId || !sku || !title || !description) {
      throw new BadRequestException(
        'storeId, sku, title, and description are required',
      );
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException(
        'quantity must be a non-negative whole number',
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

    const product: Record<string, unknown> = {
  title,
  description,
  aspects: {
    Brand: [brand],
    MPN: [mpn],
    Style: ['Casual'],
    'Size Type': ['Regular'],
     Department: ['Men'],
    Size: ['M'],
    Color: ['Black'],
    Inseam: ['32 in'],
  },
};

    if (imageUrls.length > 0) {
      product.imageUrls = imageUrls;
    }

    const response = await fetch(
      `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
      {
        method: 'PUT',
        headers: {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'Content-Language': 'en-US',
  'Accept-Language': 'en-US',
  Accept: 'application/json',
},
        body: JSON.stringify({
          availability: {
            shipToLocationAvailability: {
              quantity,
            },
          },
          condition,
          product,
        }),
      },
    );

    const responseText = await response.text();

    let ebayResult: unknown = null;

    if (responseText) {
      try {
        ebayResult = JSON.parse(responseText);
      } catch {
        ebayResult = responseText;
      }
    }

    if (!response.ok) {
      throw new BadRequestException({
        message: 'Unable to create eBay inventory item',
        ebayError: ebayResult,
      });
    }

        return {
      created: true,
      sku,
      statusCode: response.status,
      ebayResult,
    };
  }

    async createMerchantLocation(input: CreateLocationInput) {
    const account =
      await this.ebayAccountRepository.findByStore(input.storeId);

    if (!account?.accessToken) {
  throw new NotFoundException(
    'No connected eBay account was found for this store.',
  );
}
    

    let accessToken = account.accessToken;

    if (!account.expiresAt || account.expiresAt <= new Date()) {
      accessToken =
        await this.ebayService.refreshAccessToken(input.storeId);
    }

    const response = await fetch(
  `https://api.sandbox.ebay.com/sell/inventory/v1/location/${encodeURIComponent(
    input.locationKey,
  )}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Language': 'en-US',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      location: {
        address: input.address,
      },
      name: input.name,
      merchantLocationStatus: 'ENABLED',
      locationTypes: ['WAREHOUSE'],
    }),
  },
);

const responseText = await response.text();

let ebayResult: unknown = null;

if (responseText) {
  try {
    ebayResult = JSON.parse(responseText);
  } catch {
    ebayResult = responseText;
  }
}

if (!response.ok) {
  throw new BadRequestException({
    message: 'Unable to create merchant location',
    ebayError: ebayResult,
  });
}

return {
  created: true,
  locationKey: input.locationKey,
  ebayResult,
};
  }
}