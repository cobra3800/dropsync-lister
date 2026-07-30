import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-listing')
    @Post('generate-listing')
  async generateListing(@Body() body: { url?: string }) {
    const url = body.url?.trim();

    if (!url) {
      throw new BadRequestException(
        'Product URL is required',
      );
    }

    return this.aiService.generateListing(url);
  }

  @Post('optimize-listing')
  async optimizeListing(
    @Body()
    body: {
      product?: Record<string, unknown>;
      listing?: Record<string, unknown>;
    },
  ) {
    if (!body.product || !body.listing) {
      throw new BadRequestException(
        'Product and listing are required',
      );
    }

    return this.aiService.optimizeListing(
      body.product,
      body.listing,
    );
  }
}