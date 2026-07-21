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
      throw new BadRequestException('Product URL is required');
    }

    return this.aiService.generateListing(url);
  }
}