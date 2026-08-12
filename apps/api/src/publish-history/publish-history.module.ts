import { Module } from '@nestjs/common';
import { PublishHistoryController } from './publish-history.controller.js';
import { PublishHistoryService } from './publish-history.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [PublishHistoryController],
  providers: [PublishHistoryService, PrismaService],
  exports: [PublishHistoryService],
})
export class PublishHistoryModule {}