import { Module } from '@nestjs/common';
import { ImporterController } from './importer.controller.js';
import { ImporterService } from './importer.service.js';
import { ImporterFactory } from './importer.factory.js';
import { AmazonImporter } from './amazon.importer.js';
import { WalmartImporter } from './walmart.importer.js';
import { AliexpressImporter } from './aliexpress.importer.js';

@Module({
  controllers: [ImporterController],
  providers: [
    ImporterService,
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