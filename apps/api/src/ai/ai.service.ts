import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';

type GeneratedListing = {
  title: string;
  description: string;
  price: string;
  category: string;
  itemSpecifics: Record<string, string>;
};

@Injectable()
export class AiService {
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async generateListing(url: string): Promise<GeneratedListing> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    const response = await this.openai.responses.create({
      model: 'gpt-5.5',
      instructions: `
You create professional eBay product listings.

Return only valid JSON with this exact structure:
{
  "title": "string",
  "description": "string",
  "price": "string",
  "category": "string",
  "itemSpecifics": {
    "Brand": "string",
    "Condition": "string"
  }
}

Rules:
- Keep the title at 80 characters or fewer.
- Do not invent product facts that are not available.
- Use a clear, buyer-friendly description.
- Return price as numbers only, such as "29.99".
- Do not include markdown fences.
      `.trim(),
      input: `Create an eBay listing using this product URL: ${url}`,
    });

    try {
      return JSON.parse(response.output_text) as GeneratedListing;
    } catch {
      throw new InternalServerErrorException(
        'AI returned an invalid listing format',
      );
    }
  }
}