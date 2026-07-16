import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EbayService } from './ebay.service.js';
import { EbayAccountRepository } from './repositories/ebay-account.repository.js';

type EbayLocationsResponse = {
  locations?: unknown[];
  total?: number;
  next?: string;
  prev?: string;
  limit?: number;
  offset?: number;
};

@Injectable()
export class MerchantLocationService {
  constructor(
    private readonly ebayAccountRepository: EbayAccountRepository,
    private readonly ebayService: EbayService,
  ) {}

  async getLocations(storeId: string) {
    if (!storeId) {
      throw new BadRequestException('storeId is required');
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
      'https://api.sandbox.ebay.com/sell/inventory/v1/location',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Language': 'en-US',
        },
      },
    );

    const result = (await response.json()) as
      | EbayLocationsResponse
      | {
          errors?: unknown[];
        };

    if (!response.ok) {
      throw new BadRequestException({
        message: 'Unable to retrieve eBay merchant locations',
        ebayError: result,
      });
    }

    return result;
  }
}