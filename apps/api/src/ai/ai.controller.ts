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
  async generateListing(@Body() body: { url?: string }) {
    const url = body.url?.trim();

    if (!url) {
      throw new BadRequestException(
        'Product URL is required',
      );
    }

    return this.aiService.generateListing(url);
  }
  @Post('enhance-universal')
async enhanceUniversal(
  @Body()
  body: {
    product?: {
      id: string;
      source: string;
      title: string;
      description: string;
      images: string[];
      brand?: string;
      category?: string;
      specifications: Record<string, string>;
      price: number;
      quantity: number;
      condition: string;
      sku?: string;
      upc?: string;
      shippingWeight?: string;
    };
  },
) {
  if (!body.product) {
    throw new BadRequestException(
      'Universal product is required',
    );
  }

  return this.aiService.enhanceUniversalProduct(
    body.product,
  );
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