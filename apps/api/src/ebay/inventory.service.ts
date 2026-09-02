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
import sharp = require('sharp');

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
  mode: string;
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

  const values = Array.isArray(rawValues)
  ? rawValues
  : [String(rawValues)];

const cleanedValues = values
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

  if (
  categoryAspect.mode === 'SELECTION_ONLY' &&
  categoryAspect.values.length > 0
) {
  validValues = cleanedValues.filter((value) =>
    categoryAspect.values.some(
      (allowedValue) =>
        allowedValue.toLowerCase() ===
        value.toLowerCase(),
    ),
  );
}
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
  

  if (categoryAspect.cardinality === 'MULTI') {
    normalizedAspects[aspectName] =
      validValues.slice(0, 30);
  } else {
    normalizedAspects[aspectName] = [
      validValues[0],
    ];
  }
}
const presentAspectNames = new Set(
  Object.entries(normalizedAspects)
    .filter(
      ([, values]) =>
        Array.isArray(values) &&
        values.length > 0,
    )
    .map(([name]) => name.trim().toLowerCase()),
);

const missingRequiredAspects = categoryAspects
  .filter(
    (aspect) =>
      aspect.required &&
      !presentAspectNames.has(
        aspect.name.trim().toLowerCase(),
      ),
  )
  .map((aspect) => aspect.name);

if (missingRequiredAspects.length > 0) {
  console.log(
    'MISSING REQUIRED EBAY ASPECTS:',
    missingRequiredAspects,
  );

  throw new BadRequestException(
    `Missing required eBay item specifics: ${missingRequiredAspects.join(', ')}`,
  );
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
  const ebayImageUrl = await this.importImageToEbay(
    imageUrls[0],
    accessToken,
  );

  product.imageUrls = [ebayImageUrl];
}
    console.log('IMAGE URLS TO EBAY:', imageUrls);
console.log('PRODUCT IMAGE URLS:', product.imageUrls);
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
    
const existingResponse = await fetch(
  `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(
    sku,
  )}`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Accept-Language': 'en-US',
    },
  },
);

const existingText = await existingResponse.text();

let existingItem: any = {};

if (existingResponse.ok && existingText) {
  try {
    existingItem = JSON.parse(existingText);
  } catch {
    existingItem = {};
  }
}
const existingProduct =
  existingItem?.product && typeof existingItem.product === 'object'
    ? existingItem.product
    : {};

const existingAspects =
  existingProduct?.aspects && typeof existingProduct.aspects === 'object'
    ? existingProduct.aspects
    : {};

const mergedProduct = {
  ...existingProduct,
  ...product,
  aspects: {
    ...existingAspects,
    ...((product.aspects as Record<string, string[]>) ?? {}),
    Type:
      (product.aspects as Record<string, string[]>)?.Type?.length
        ? (product.aspects as Record<string, string[]>).Type
        : existingAspects.Type?.length
          ? existingAspects.Type
          : ['Mop & Bucket Set'],
  },
};
const existingAvailability =
  existingItem?.availability && typeof existingItem.availability === 'object'
    ? existingItem.availability
    : {};

const existingShipAvailability =
  existingAvailability?.shipToLocationAvailability &&
  typeof existingAvailability.shipToLocationAvailability === 'object'
    ? existingAvailability.shipToLocationAvailability
    : {};
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
  ...existingAvailability,
  shipToLocationAvailability: {
    ...existingShipAvailability,
    quantity,
  },
},
          condition,
          product: mergedProduct,
        }),
      },
    );

    const responseText = await response.text();
    console.log('EBAY INVENTORY PUT STATUS:', response.status);
console.log('EBAY INVENTORY PUT RESPONSE:', responseText);

    let ebayResult: unknown = null;

    if (responseText) {
      try {
        ebayResult = JSON.parse(responseText);
      } catch {
        ebayResult = responseText;
      }
    }

    if (!response.ok) {
      console.error('eBay inventory update failed:', ebayResult);
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
  private async prepareImageForEbay(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new BadRequestException(
      `Unable to download image: ${response.status}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const outputBuffer = await sharp(inputBuffer)
    .resize({
      width: 3000,
      height: 3000,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 90,
    })
    .toBuffer();

  return outputBuffer;
}
private async importImageToEbay(
  imageUrl: string,
  accessToken: string,
): Promise<string> {
  const imageBuffer = await this.prepareImageForEbay(imageUrl);

  const formData = new FormData();

  formData.append(
    'image',
    new Blob([new Uint8Array(imageBuffer)], {
      type: 'image/jpeg',
    }),
    'dropsync-image.jpg',
  );

  const response = await fetch(
    'https://apim.sandbox.ebay.com/commerce/media/v1_beta/image/create_image_from_file',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body: formData,
    },
  );

  const responseText = await response.text();

  console.log('EBAY MEDIA STATUS:', response.status);
  console.log('EBAY MEDIA RESPONSE:', responseText);

  if (!response.ok) {
    throw new BadRequestException(
      `Unable to import image into eBay: ${responseText}`,
    );
  }

  let result: { imageUrl?: string } = {};

  if (responseText) {
    result = JSON.parse(responseText) as { imageUrl?: string };
  }

  if (!result.imageUrl) {
    throw new BadRequestException(
      'eBay Media API did not return an imageUrl.',
    );
  }

  return result.imageUrl;
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