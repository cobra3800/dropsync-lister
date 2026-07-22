import { Module } from '@nestjs/common';
import { ImporterController } from './importer.controller.js';
import { ImporterService } from './importer.service.js';

@Module({
  controllers: [ImporterController],
  providers: [ImporterService],
  exports: [ImporterService],
})
export class ImporterModule {}