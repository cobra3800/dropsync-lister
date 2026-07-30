import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { EbayController } from './ebay.controller.js';
import { EbayService } from './ebay.service.js';
import { MerchantLocationService } from './merchant-location.service.js';
import { EbayAccountRepository } from './repositories/ebay-account.repository.js';
import { InventoryService } from './inventory.service.js';
import { OfferService } from './offer.service.js';
import { TaxonomyService } from './taxonomy.service.js';
import { AspectsService } from './aspects.service.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [
    AiModule,
  ],
  controllers: [EbayController],
  providers: [
    PrismaService,
    EbayAccountRepository,
    EbayService,
    MerchantLocationService,
    InventoryService,
     OfferService,
     TaxonomyService,
      AspectsService,
  ],
  exports: [
    EbayService,
    EbayAccountRepository,
    MerchantLocationService,
    InventoryService,
     OfferService,
     TaxonomyService,
      AspectsService,

  ],
})
export class EbayModule {}