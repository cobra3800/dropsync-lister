import { forwardRef, Module } from '@nestjs/common';
import { ImporterController } from './importer.controller.js';
import { ImportHistoryModule } from './import-history/import-history.module.js';
import { ImporterService } from './importer.service.js';
import { ImporterFactory } from './importer.factory.js';
import { AmazonImporter } from './amazon.importer.js';
import { WalmartImporter } from './walmart.importer.js';
import { AliexpressImporter } from './aliexpress.importer.js';
import { ImportQueueService } from './import-queue.service.js';
import { ImportQueueWorker } from './import-queue.worker.js';
import { PrismaService } from '../prisma.service.js';
import { AiModule } from '../ai/ai.module.js';
import { EbayModule } from '../ebay/ebay.module.js';

@Module({
  imports: [
  forwardRef(() => AiModule),
  EbayModule,
  ImportHistoryModule,
],
  controllers: [ImporterController],
  providers: [
    PrismaService,
    ImporterService,
    ImportQueueService,
    ImportQueueWorker,
    ImporterFactory,
    AmazonImporter,
    WalmartImporter,
    AliexpressImporter,
  ],
  exports: [
    ImporterService,
    ImporterFactory,
  ],
})
export class ImporterModule {}