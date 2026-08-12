import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { ListingsService } from './listings.service.js';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
  ) {}

  @Get()
  async getAll() {
    return this.listingsService.getAll();
  }

  @Get(':id')
async findOne(@Param('id') id: string) {
  return this.listingsService.findOne(id);
}

@Patch(':id')
update(
  @Param('id') id: string,
  @Body() body: Record<string, unknown>,
) {
  return this.listingsService.update(id, body);
}
}