import {
  BadRequestException,
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
import { TaxonomyService } from './taxonomy.service.js';
import { AspectsService } from './aspects.service.js';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma.service';

@Controller('ebay')
export class EbayController {
  constructor(
  private readonly ebayService: EbayService,
  private readonly merchantLocationService: MerchantLocationService,
  private readonly inventoryService: InventoryService,
  private readonly offerService: OfferService,
  private readonly taxonomyService: TaxonomyService,
  private readonly aspectsService: AspectsService,
  private readonly prisma: PrismaService,
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
  @Body()
  input: {
    storeId: string;
    offerId: string;
    title?: string;
  },
) {
  return this.offerService.publishOffer(input);
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
@Get('category-suggestions')
async getCategorySuggestions(
  @Query('storeId') storeId: string,
  @Query('title') title: string,
) {
  if (!storeId || !title) {
    throw new BadRequestException(
      'storeId and title are required',
    );
  }

  return this.taxonomyService.suggestCategory(
    storeId,
    title,
  );
}
@Get('category-aspects')
async getCategoryAspects(
  @Query('storeId') storeId: string,
  @Query('categoryId') categoryId: string,
) {
  if (!storeId || !categoryId) {
    throw new BadRequestException(
      'storeId and categoryId are required',
    );
  }

  return this.aspectsService.getCategoryAspects(
    storeId,
    categoryId,
  );
}
@Post('publish-ai-listing')
async publishAiListing(
  @Body()
  body: {
    storeId: string;
    sku: string;
    title: string;
    description: string;
    price: number;
    quantity: number;
    categoryId: string;
    condition?: string;
    imageUrls?: string[];
    brand?: string;
    mpn?: string;
    aspects?: Record<string, string[]>;
  },
) {
  const inventoryResult =
    await this.inventoryService.createInventoryItem({
      storeId: body.storeId,
      categoryId: body.categoryId,
      sku: body.sku,
      title: body.title,
      description: body.description,
      quantity: body.quantity,
      condition: body.condition,
      imageUrls: body.imageUrls,
      brand: body.brand,
      mpn: body.mpn,
      aspects: body.aspects,
    });
    const policies = await this.ebayService.getBusinessPolicies(body.storeId);

const fulfillmentData =
  policies.fulfillmentPolicies as {
    fulfillmentPolicies?: Array<{
      fulfillmentPolicyId?: string;
    }>;
  };

const paymentData =
  policies.paymentPolicies as {
    paymentPolicies?: Array<{
      paymentPolicyId?: string;
    }>;
  };

const returnData =
  policies.returnPolicies as {
    returnPolicies?: Array<{
      returnPolicyId?: string;
    }>;
  };

const fulfillmentPolicyId =
  fulfillmentData.fulfillmentPolicies?.[0]?.fulfillmentPolicyId ?? "";

const paymentPolicyId =
  paymentData.paymentPolicies?.[0]?.paymentPolicyId ?? "";

const returnPolicyId =
  returnData.returnPolicies?.[0]?.returnPolicyId ?? "";

if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
  throw new BadRequestException(
    "Missing eBay fulfillment, payment, or return policy.",
  );
}

  const offerResult = await this.offerService.createOffer({
    storeId: body.storeId,
    sku: body.sku,
    availableQuantity: body.quantity,
    categoryId: body.categoryId,
    merchantLocationKey: "main",
    price: body.price,
    fulfillmentPolicyId,
paymentPolicyId,
returnPolicyId,
  });

  const offerId =
    typeof offerResult === 'object' &&
    offerResult !== null &&
    'offerId' in offerResult &&
    typeof offerResult.offerId === 'string'
      ? offerResult.offerId
      : null;

  if (!offerId) {
    throw new BadRequestException('eBay did not return an offerId.');
  }

  const publishResult = await this.offerService.publishOffer({
    storeId: body.storeId,
    offerId,
    title: body.title,
  });
const listingId =
  typeof (publishResult as any)?.listingId === 'string'
    ? (publishResult as any).listingId
    : null;

await this.prisma.listing.create({
  data: {
    storeId: body.storeId,
    title: body.title,
    sku: body.sku,
    price: body.price,
    quantity: body.quantity,
    marketplace: 'EBAY',
    status: 'ACTIVE',
    imageUrl:
      Array.isArray(body.imageUrls) && body.imageUrls.length > 0
        ? body.imageUrls[0]
        : null,
    externalId: listingId,
    externalUrl: null,
  },
});
  return {
    inventoryResult,
    offerResult,
    publishResult,
  };
}

@Get('account-deletion')
handleAccountDeletionChallenge(
  @Query('challenge_code') challengeCode: string,
) {
  const verificationToken = 'DropSyncVerificationToken20260001';

  const endpoint =
  'https://acceptance-approved-injuries-trend.trycloudflare.com/ebay/account-deletion';

  const challengeResponse = createHash('sha256')
    .update(challengeCode)
    .update(verificationToken)
    .update(endpoint)
    .digest('hex');

  return { challengeResponse };
}

@Post('account-deletion')
handleAccountDeletionNotification(@Body() body: unknown) {
  console.log('eBay account-deletion notification received:', body);

  return { received: true };
}
}
