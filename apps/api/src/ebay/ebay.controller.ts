import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Res,
} from '@nestjs/common';
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
}
  
