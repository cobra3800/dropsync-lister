import { Module } from '@nestjs/common';
import { ImporterModule } from './importer/importer.module.js';
import { ListingsModule } from './listings/listings.module.js';
import { AppController } from './app.controller.js';
import { PrismaService } from './prisma.service.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { StoresModule } from './stores/stores.module.js';
import { AiModule } from './ai/ai.module.js';
import { ListingDraftsModule } from './listing-drafts/listing-drafts.module';
import { EbayModule } from './ebay/ebay.module.js';
import { PublishHistoryModule } from './publish-history/publish-history.module.js';
import { OrdersModule } from './orders/orders.module';
@Module({
  imports: [
  AuthModule,
  OrganizationsModule,
  StoresModule,
  AiModule,
  ImporterModule,
  ListingDraftsModule,
  EbayModule,
  PublishHistoryModule,
  ListingsModule,
  OrdersModule,
],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
