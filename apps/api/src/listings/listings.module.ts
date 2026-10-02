import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ListingsController } from './listings.controller.js';
import { ListingsService } from './listings.service.js';
import { EbayModule } from '../ebay/ebay.module.js';
@Module({
  imports: [EbayModule],
  controllers: [ListingsController],
  providers: [ListingsService, PrismaService],
  exports: [ListingsService],
})
export class ListingsModule {}