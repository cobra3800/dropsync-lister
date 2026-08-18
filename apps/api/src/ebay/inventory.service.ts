import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EbayService } from './ebay.service.js';
import { EbayAccountRepository } from './repositories/ebay-account.repository.js';
import type { CreateLocationInput } from './location.dto.js';
import { AspectMapperService } from '../ai/aspect-mapper.service.js';
import { AspectsService } from './aspects.service.js';

export type CreateInventoryItemInput = {
  storeId: string;
  categoryId?: string;
  sku: string;
  title: string;
  description: string;
  quantity: number;
  condition?: string;
  imageUrls?: string[];
  brand?: string;
  mpn?: string;
  aspects?: Record<string, string[]>;
};

@Injectable()
export class InventoryService {
  constructor(
  private readonly ebayAccountRepository: EbayAccountRepository,
  private readonly ebayService: EbayService,
  private readonly aspectMapper: AspectMapperService,
  private readonly aspectsService: AspectsService,
) {}

  async createInventoryItem(input: CreateInventoryItemInput) {
    const {
  storeId,
  categoryId,
  sku,
  title,
  description,
  quantity,
  condition: rawCondition,
  imageUrls = [],
  brand,
  mpn,
  aspects,
} = input;
    const condition = (rawCondition ?? 'NEW')
  .trim()
  .toUpperCase()
  .replace(/[\s-]+/g, '_');

    if (!storeId || !sku || !title || !description) {
      throw new BadRequestException(
        'storeId, sku, title, and description are required',
      );
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException(
        'quantity must be a non-negative whole number',
      );
    }

    const account =
      await this.ebayAccountRepository.findByStore(storeId);

    if (!account?.accessToken) {
  throw new NotFoundException(
    'No connected eBay account was found for this store.',
  );
}

let accessToken = account.accessToken;

    if (!account.expiresAt || account.expiresAt <= new Date()) {
      accessToken =
        await this.ebayService.refreshAccessToken(storeId);
    }

 let requiredAspectNames = Object.keys(aspects ?? {});

let categoryAspects: Array<{
  name: string;
  required: boolean;
  usage: string;
  cardinality: string;
  values: string[];
}> = [];

if (categoryId) {
  categoryAspects =
    await this.aspectsService.getCategoryAspects(
      storeId,
      categoryId,
    );
    const typeAspect = categoryAspects.find(
  (aspect) => aspect.name.toLowerCase() === 'type',
);

console.log(
  'EBAY TYPE ASPECT:',
  JSON.stringify(typeAspect, null, 2),
);
if (
  typeAspect &&
  typeAspect.values.length > 0 &&
  !requiredAspectNames.some(
    (name) => name.toLowerCase() === 'type',
  )
) {
  requiredAspectNames.push('Type');
}
  const taxonomyRequiredNames = categoryAspects
    .filter(
      (aspect) =>
        aspect.required &&
        aspect.name.trim().length > 0,
    )
    .map((aspect) => aspect.name);

  requiredAspectNames = Array.from(
    new Set([
      ...taxonomyRequiredNames,
      ...requiredAspectNames,
    ]),
  );
}

const mappedAspects = await this.aspectMapper.map(
  title,
  description,
  requiredAspectNames,
);
console.log(
  'MAPPED ASPECTS:',
  JSON.stringify(mappedAspects, null, 2),
);
const combinedAspects: Record<string, string[]> = {
  ...mappedAspects,
  ...(aspects ?? {}),
};

const normalizedAspects: Record<string, string[]> = {};

for (const [aspectName, rawValues] of Object.entries(
  combinedAspects,
)) {
  const categoryAspect = categoryAspects.find(
    (aspect) =>
      aspect.name.toLowerCase() ===
      aspectName.toLowerCase(),
  );

  const cleanedValues = rawValues
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) =>
    value.length > 65
      ? value.slice(0, 65).trim()
      : value,
  );

  if (cleanedValues.length === 0) {
    continue;
  }

  if (!categoryAspect) {
    normalizedAspects[aspectName] = [
      cleanedValues[0],
    ];
    continue;
  }

  let validValues = cleanedValues;

  if (categoryAspect.values.length > 0) {
    validValues = cleanedValues.filter((value) =>
      categoryAspect.values.some(
        (allowedValue) =>
          allowedValue.toLowerCase() ===
          value.toLowerCase(),
      ),
    );
if (
  validValues.length === 0 &&
  categoryAspect.required
) {
  console.log('REQUIRED ASPECT VALUE REJECTED:', {
    categoryId,
    aspectName,
    suppliedValues: cleanedValues,
    allowedValues: categoryAspect.values,
  });
}
    if (validValues.length === 0) {
      continue;
    }
  }

  if (categoryAspect.cardinality === 'MULTI') {
    normalizedAspects[aspectName] =
      validValues.slice(0, 30);
  } else {
    normalizedAspects[aspectName] = [
      validValues[0],
    ];
  }
}
console.log(
  'NORMALIZED ASPECTS:',
  JSON.stringify(normalizedAspects, null, 2),
);
const product: Record<string, unknown> = {
  title,
  description,
  aspects: {
  ...normalizedAspects,
  Brand:
    normalizedAspects.Brand?.length
      ? normalizedAspects.Brand
      : [brand || 'Unbranded'],
  MPN:
    normalizedAspects.MPN?.length
      ? normalizedAspects.MPN
      : [mpn || 'Does Not Apply'],
},
};

    if (imageUrls.length > 0) {
      product.imageUrls = imageUrls;
    }
console.log('Sending condition to eBay:', condition);
console.log('SKU:', sku);
console.log('Request body:', JSON.stringify({
  availability: {
    shipToLocationAvailability: {
      quantity,
    },
  },
  condition,
  product,
}, null, 2));
    const response = await fetch(
      `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
      {
        method: 'PUT',
        headers: {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'Content-Language': 'en-US',
  'Accept-Language': 'en-US',
  Accept: 'application/json',
},
        body: JSON.stringify({
          availability: {
            shipToLocationAvailability: {
              quantity,
            },
          },
          condition,
          product,
        }),
      },
    );

    const responseText = await response.text();

    let ebayResult: unknown = null;

    if (responseText) {
      try {
        ebayResult = JSON.parse(responseText);
      } catch {
        ebayResult = responseText;
      }
    }

    if (!response.ok) {
      throw new BadRequestException({
        message: 'Unable to create eBay inventory item',
        ebayError: ebayResult,
      });
    }

        return {
      created: true,
      sku,
      statusCode: response.status,
      ebayResult,
    };
  }

    async createMerchantLocation(input: CreateLocationInput) {
    const account =
      await this.ebayAccountRepository.findByStore(input.storeId);

    if (!account?.accessToken) {
  throw new NotFoundException(
    'No connected eBay account was found for this store.',
  );
}
    

    let accessToken = account.accessToken;

    if (!account.expiresAt || account.expiresAt <= new Date()) {
      accessToken =
        await this.ebayService.refreshAccessToken(input.storeId);
    }

    const response = await fetch(
  `https://api.sandbox.ebay.com/sell/inventory/v1/location/${encodeURIComponent(
    input.locationKey,
  )}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Language': 'en-US',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      location: {
        address: input.address,
      },
      name: input.name,
      merchantLocationStatus: 'ENABLED',
      locationTypes: ['WAREHOUSE'],
    }),
  },
);

const responseText = await response.text();

let ebayResult: unknown = null;

if (responseText) {
  try {
    ebayResult = JSON.parse(responseText);
  } catch {
    ebayResult = responseText;
  }
}

if (!response.ok) {
  throw new BadRequestException({
    message: 'Unable to create merchant location',
    ebayError: ebayResult,
  });
}

return {
  created: true,
  locationKey: input.locationKey,
  ebayResult,
};
  }
}