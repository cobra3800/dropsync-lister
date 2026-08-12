import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { ImportHistoryController } from './import-history.controller.js';
import { ImportHistoryService } from './import-history.service.js';

@Module({
  controllers: [ImportHistoryController],
  providers: [ImportHistoryService, PrismaService],
  exports: [ImportHistoryService],
})
export class ImportHistoryModule {}