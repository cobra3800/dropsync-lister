import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { EbayController } from './ebay.controller.js';
import { EbayService } from './ebay.service.js';
import { MerchantLocationService } from './merchant-location.service.js';
import { EbayAccountRepository } from './repositories/ebay-account.repository.js';
import { InventoryService } from './inventory.service.js';

@Module({
  controllers: [EbayController],
  providers: [
    PrismaService,
    EbayAccountRepository,
    EbayService,
    MerchantLocationService,
    InventoryService,
  ],
  exports: [
    EbayService,
    EbayAccountRepository,
    MerchantLocationService,
    InventoryService,

  ],
})
export class EbayModule {}