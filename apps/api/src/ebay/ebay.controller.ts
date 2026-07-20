import {
  Body,
  Controller,
  Get,
   Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { OfferService } from './offer.service.js';
import type { Response } from 'express';
import { EbayService } from './ebay.service.js';
import { MerchantLocationService } from './merchant-location.service';
import { InventoryService } from './inventory.service.js';
import type { CreateInventoryItemInput } from './inventory.service.js';
import type { CreateLocationInput } from './location.dto.js';

@Controller('ebay')
export class EbayController {
  constructor(
  private readonly ebayService: EbayService,
  private readonly merchantLocationService: MerchantLocationService,
  private readonly inventoryService: InventoryService,
  private readonly offerService: OfferService,
) {}

  @Get('connect')
  connect(
    @Query('storeId') storeId: string,
    @Res() res: Response,
  ) {
    return res.redirect(
      this.ebayService.getConnectUrl(storeId),
    );
  }

  @Get('callback')
async callback(
  @Query('code') code?: string,
  @Query('state') storeId?: string,
  @Query('error') error?: string,
) {
  if (error) {
    return {
      connected: false,
      error,
    };
  }

  if (!code) {
    return {
      connected: false,
      error: 'missing_authorization_code',
    };
  }

  if (!storeId) {
    return {
      connected: false,
      error: 'missing_store_id',
    };
  }

  const tokens =
    await this.ebayService.exchangeAuthorizationCode(
      code,
      storeId,
    );

  return {
    connected: true,
    tokenType: tokens.token_type,
    accessTokenExpiresIn: tokens.expires_in,
    refreshTokenReceived: Boolean(tokens.refresh_token),
    refreshTokenExpiresIn:
      tokens.refresh_token_expires_in ?? null,
  };
}

@Post('inventory-item')
async createInventoryItem(
  @Body() body: CreateInventoryItemInput,
) {
  return this.inventoryService.createInventoryItem(body);
}

  @Get('locations')
async getLocations(
  @Query('storeId') storeId: string,
) {
  return this.merchantLocationService.getLocations(storeId);
}

  @Get('programs')
  async getPrograms(
    @Query('storeId') storeId: string,
  ) {
    return this.ebayService.getOptedInPrograms(storeId);
  }
@Put('merchant-location')
async createMerchantLocation(
  @Body() input: CreateLocationInput,
) {
  return this.inventoryService.createMerchantLocation(input);
}
@Post('create-offer')
async createOffer(
  @Body() body: any,
) {
  return this.offerService.createOffer(body);
}
@Post('publish-offer')
async publishOffer(
  @Body() body: { storeId: string; offerId: string },
) {
  return this.offerService.publishOffer(body);
}
@Get('policies')
async getPolicies(
  @Query('storeId') storeId: string,
) {
  return this.ebayService.getBusinessPolicies(storeId);
}
@Post('policies/create-fulfillment')
async createFulfillmentPolicy(
  @Body() body: { storeId: string },
) {
  return this.ebayService.createFulfillmentPolicy(body.storeId);
}
@Post('policies/create-defaults')
async createDefaultPolicies(
  @Body() body: { storeId: string },
) {
  return this.ebayService.createDefaultPolicies(body.storeId);
}
}
  
