import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ImportHistoryService } from './import-history.service.js';

@Controller('import-history')
export class ImportHistoryController {
  constructor(
    private readonly importHistoryService: ImportHistoryService,
  ) {}

  @Get()
async getAll() {
  return this.importHistoryService.getAll();
}

@Delete('completed')
async clearCompleted() {
  return this.importHistoryService.clearCompleted();
}

@Delete(':id')
async deleteOne(@Param('id') id: string) {
  return this.importHistoryService.deleteOne(id);
}
}