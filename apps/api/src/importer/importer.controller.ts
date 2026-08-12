import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ImporterService } from './importer.service.js';
import { ImportQueueService } from './import-queue.service.js';

@Controller('importer')
export class ImporterController {
  constructor(
    private readonly importerService: ImporterService,
    private readonly importQueueService: ImportQueueService,
  ) {}

  @Post('product')
async importProduct(@Body() body: { url?: string }) {
  const url = body.url?.trim();

  if (!url) {
    throw new BadRequestException('Product URL is required');
  }

  return this.importerService.importProduct(url);
}

@Post('universal')
async importUniversal(@Body() body: { url?: string }) {
  const url = body.url?.trim();

  if (!url) {
    throw new BadRequestException('Product URL is required');
  }

  return this.importerService.importUniversalProduct(url);
}

@Post('queue')
async enqueue(
    @Body() body: {
      storeId?: string;
      supplierUrl?: string;
    },
  ) {
    const storeId = body.storeId?.trim();
    const supplierUrl = body.supplierUrl?.trim();

    if (!storeId) {
      throw new BadRequestException('Store ID is required');
    }

    if (!supplierUrl) {
      throw new BadRequestException('Supplier URL is required');
    }

    return this.importQueueService.enqueue(storeId, supplierUrl);
  }

  @Get('queue')
async getQueue() {
  return this.importQueueService.getAll();
}

@Delete('queue/completed')
async clearCompleted() {
  return this.importQueueService.clearCompleted();
}

@Delete('queue/:id')
async deleteQueueItem(@Param('id') id: string) {
  return this.importQueueService.deleteQueueItem(id);
}
}