import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ImporterService } from '../importer/importer.service.js';
import type { UniversalProduct } from '../core/universal-product.js';

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

  async generateListing(
    url: string,
  ): Promise<GeneratedListing> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    const product =
      await this.importerService.importProduct(url);

    const response =
      await this.openai.responses.create({
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
      return JSON.parse(
        response.output_text,
      ) as GeneratedListing;
    } catch {
      throw new InternalServerErrorException(
        'AI returned an invalid listing format',
      );
    }
  }

  async enhanceUniversalProduct(
    product: UniversalProduct,
  ): Promise<GeneratedListing> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    const response =
      await this.openai.responses.create({
        model: 'gpt-5.5',

        instructions: `
You are a professional ecommerce listing optimization expert.

Using the supplied product information, create a marketplace-ready listing.

Do not invent unsupported product facts.

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

- Keep the title under 80 characters.
- Make the title clear and search-friendly.
- Write a professional description.
- Preserve accurate brand, model, size, color, material, and specifications.
- Do not invent missing specifications.
- Recommend a reasonable selling price based on the supplied product data.
- Suggest the most appropriate marketplace category.
- Generate useful item specifics.
- Generate buyer search keywords.
- Estimate shipping weight only when reasonably supported.
- Return JSON only.
        `.trim(),

        input: `
Universal Product:

${JSON.stringify(product, null, 2)}
        `.trim(),
      });

    try {
      return JSON.parse(
        response.output_text,
      ) as GeneratedListing;
    } catch {
      throw new InternalServerErrorException(
        'AI returned an invalid universal listing format',
      );
    }
  }

  async optimizeListing(
    product: Record<string, unknown>,
    listing: Record<string, unknown>,
  ): Promise<GeneratedListing> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    const response =
      await this.openai.responses.create({
        model: 'gpt-5.5',

        instructions: `
You are a professional eBay listing optimization expert.

Improve the existing eBay listing using the supplier product data.

Return ONLY valid JSON in this exact format:

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

- Keep the title under 80 characters.
- Make the title clear, persuasive, and SEO-friendly.
- Improve the description without inventing unsupported facts.
- Preserve accurate brand, model, dimensions, color, and specifications.
- Recommend a competitive selling price.
- Improve item specifics using the available product information.
- Generate useful buyer search keywords.
- Return JSON only, with no markdown.
        `.trim(),

        input: `
Supplier product:

${JSON.stringify(product, null, 2)}

Current listing:

${JSON.stringify(listing, null, 2)}
        `.trim(),
      });

    try {
      const optimized = JSON.parse(
        response.output_text,
      ) as GeneratedListing;

      return {
        title:
          optimized.title ||
          String(listing.title ?? ''),

        description:
          optimized.description ||
          String(listing.description ?? ''),

        price:
          optimized.price ||
          String(listing.price ?? ''),

        category:
          optimized.category ||
          String(listing.category ?? ''),

        condition:
          optimized.condition ||
          String(listing.condition ?? 'NEW'),

        itemSpecifics:
          optimized.itemSpecifics ?? {},

        seoKeywords:
          Array.isArray(optimized.seoKeywords)
            ? optimized.seoKeywords
            : [],

        shippingWeight:
          optimized.shippingWeight ||
          String(listing.shippingWeight ?? ''),
      };
    } catch {
      throw new InternalServerErrorException(
        'AI returned an invalid optimized listing format',
      );
    }
  }

  async generateAspects(
    title: string,
    description: string,
    requiredAspects: string[],
  ): Promise<Record<string, string[]>> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    if (requiredAspects.length === 0) {
      return {};
    }

    const response =
      await this.openai.responses.create({
        model: 'gpt-5.5',

        instructions: `
You are an expert eBay item-specifics mapper.

Use only facts supported by the product title and description.

Return ONLY valid JSON.

The JSON keys must exactly match the required aspect names provided.

Every value must be an array containing one string.

Do not invent unsupported brand names, model numbers, sizes, materials,
compatibility information, or technical specifications.

When a reliable value cannot be determined, use "Does Not Apply".

Example format:

{
  "Brand": ["Dell"],
  "Processor": ["Intel Core i5"],
  "Color": ["Black"]
}
        `.trim(),

        input: `
Product title:

${title}

Product description:

${description}

Required eBay aspects:

${JSON.stringify(requiredAspects, null, 2)}
        `.trim(),
      });

    try {
      const parsed = JSON.parse(
        response.output_text,
      ) as Record<string, unknown>;

      const generatedAspects:
        Record<string, string[]> = {};

      for (const aspectName of requiredAspects) {
        const value = parsed[aspectName];

        if (
          Array.isArray(value) &&
          typeof value[0] === 'string' &&
          value[0].trim()
        ) {
          generatedAspects[aspectName] = [
            value[0].trim(),
          ];
        } else if (
          typeof value === 'string' &&
          value.trim()
        ) {
          generatedAspects[aspectName] = [
            value.trim(),
          ];
        } else {
          generatedAspects[aspectName] = [
            'Does Not Apply',
          ];
        }
      }

      return generatedAspects;
    } catch {
      throw new InternalServerErrorException(
        'AI returned an invalid aspect format',
      );
    }
  }
}