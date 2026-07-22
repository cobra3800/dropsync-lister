import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ImporterService } from './importer.service.js';

@Controller('importer')
export class ImporterController {
  constructor(
    private readonly importerService: ImporterService,
  ) {}

  @Post('product')
  async importProduct(@Body() body: { url?: string }) {
    const url = body.url?.trim();

    if (!url) {
      throw new BadRequestException('Product URL is required');
    }

    return this.importerService.importProduct(url);
  }
}