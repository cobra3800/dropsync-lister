import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ImporterService } from '../importer/importer.service.js';

type GeneratedListing = {
  title: string;
  description: string;
  price: string;
  category: string;
  itemSpecifics: Record<string, string>;
  condition: string;
seoKeywords: string[];
shippingWeight: string;
};

@Injectable()
export class AiService {
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  constructor(
  private readonly importerService: ImporterService,
) {}

  async generateListing(url: string): Promise<GeneratedListing> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }
    const product = await this.importerService.importProduct(url);
    const response = await this.openai.responses.create({
  model: 'gpt-5.5',
  instructions: `
You are a professional eBay listing expert.

Using the imported supplier product information, create an optimized eBay listing.

Return ONLY valid JSON using this exact format:

{
  "title": "",
  "description": "",
  "price": "",
  "category": "",
  "condition": "",
  "itemSpecifics": {},
  "seoKeywords": [],
  "shippingWeight": ""
}

Rules:

- Write a title under 80 characters.
- Make the description persuasive and SEO friendly.
- Improve grammar.
- Recommend a competitive selling price.
- Suggest the best eBay category.
- Generate realistic item specifics.
- Include search keywords buyers would use.
- Estimate shipping weight.
`.trim(),

  input: `
Supplier Product

${JSON.stringify(product, null, 2)}
`.trim(),
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