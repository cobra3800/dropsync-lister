import { Injectable } from '@nestjs/common';
import { GenerateListingDto } from './dto/generate-listing.dto.js';

@Injectable()
export class AiService {
  generateListing(dto: GenerateListingDto) {
    return {
      title: `${dto.brand} ${dto.productName}`,
      description: `Professional listing generated for ${dto.productName}.`,
      keywords: [dto.brand, dto.productName, 'eBay', 'DropSync'],
      itemSpecifics: {
        Brand: dto.brand,
        Condition: dto.condition,
      },
      priceSuggestion: 29.99,
    };
  }
}