import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { GenerateListingDto } from './dto/generate-listing.dto.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-listing')
  generate(@Body() dto: GenerateListingDto) {
    return this.aiService.generateListing(dto);
  }
}