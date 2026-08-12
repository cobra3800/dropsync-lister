import { Controller, Get, Param } from '@nestjs/common';
import { PublishHistoryService } from './publish-history.service.js';

@Controller('publish-history')
export class PublishHistoryController {
  constructor(
    private readonly publishHistoryService: PublishHistoryService,
  ) {}

  @Get(':storeId')
  findAllByStore(@Param('storeId') storeId: string) {
    return this.publishHistoryService.findAllByStore(storeId);
  }
}