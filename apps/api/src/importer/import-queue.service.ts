import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ImporterService } from './importer.service.js';
import { AiService } from '../ai/ai.service.js';
import { InventoryService } from '../ebay/inventory.service.js';
import { OfferService } from '../ebay/offer.service.js';
import { TaxonomyService } from '../ebay/taxonomy.service.js';
import { EbayService } from '../ebay/ebay.service.js';

@Injectable()
export class ImportQueueService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly importerService: ImporterService,
  private readonly aiService: AiService,
  private readonly inventoryService: InventoryService,
  private readonly offerService: OfferService,
  private readonly taxonomyService: TaxonomyService,
  private readonly ebayService: EbayService,
) {}

  async enqueue(storeId: string, supplierUrl: string) {
    return this.prisma.importQueue.create({
      data: {
        storeId,
        supplierUrl,
      },
    });
  }

  async getPending() {
    return this.prisma.importQueue.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    progress = 0,
  ) {
    return this.prisma.importQueue.update({
      where: {
        id,
      },
      data: {
        status,
        progress,
      },
    });
  }

  async processNext() {
  const job = await this.prisma.importQueue.findFirst({
    where: {
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (!job) {
    return null;
  }

  await this.prisma.importQueue.update({
    where: {
      id: job.id,
    },
    data: {
      status: 'PROCESSING',
      progress: 10,
      error: null,
    },
  });

  try {
    // 1. Import the supplier product.
    const product = await this.importerService.importProduct(
      job.supplierUrl,
    );

    await this.prisma.importQueue.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'PROCESSING',
        progress: 25,
        title: product.title,
      },
    });

    // 2. Generate the AI eBay listing.
    const generatedListing =
      await this.aiService.generateListing(job.supplierUrl);

    await this.prisma.importQueue.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'PROCESSING',
        progress: 40,
        title: generatedListing.title,
      },
    });

    // 3. Find the best eBay category.
    const categorySuggestions =
      await this.taxonomyService.suggestCategory(
        job.storeId,
        generatedListing.title,
      );

    const firstSuggestion = categorySuggestions[0] as {
      category?: {
        categoryId?: string;
      };
    } | undefined;

    const categoryId =
      firstSuggestion?.category?.categoryId;

    if (!categoryId) {
      throw new Error('eBay did not return a suggested category.');
    }

    // 4. Load the connected store's eBay business policies.
    const policies =
      await this.ebayService.getBusinessPolicies(job.storeId);

    const fulfillmentData =
      policies.fulfillmentPolicies as {
        fulfillmentPolicies?: Array<{
          fulfillmentPolicyId?: string;
        }>;
      };

    const paymentData =
      policies.paymentPolicies as {
        paymentPolicies?: Array<{
          paymentPolicyId?: string;
        }>;
      };

    const returnData =
      policies.returnPolicies as {
        returnPolicies?: Array<{
          returnPolicyId?: string;
        }>;
      };

    const fulfillmentPolicyId =
      fulfillmentData.fulfillmentPolicies?.[0]
        ?.fulfillmentPolicyId ?? '';

    const paymentPolicyId =
      paymentData.paymentPolicies?.[0]
        ?.paymentPolicyId ?? '';

    const returnPolicyId =
      returnData.returnPolicies?.[0]
        ?.returnPolicyId ?? '';

    if (
      !fulfillmentPolicyId ||
      !paymentPolicyId ||
      !returnPolicyId
    ) {
      throw new Error(
        'Missing eBay fulfillment, payment, or return policy.',
      );
    }

    await this.prisma.importQueue.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'PROCESSING',
        progress: 55,
      },
    });

    const productData = product as Record<string, any>;
    const listingData =
      generatedListing as Record<string, any>;

    const sku =
      typeof productData.sku === 'string' &&
      productData.sku.trim()
        ? productData.sku.trim()
        : `DS-${job.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;

    const rawPrice = Number(
      listingData.price ?? productData.price ?? 0,
    );

    const offerPrice =
      Number.isFinite(rawPrice) && rawPrice > 0
        ? rawPrice
        : 19.99;

    const title =
      generatedListing.title ||
      productData.title ||
      'DropSync Product';

    const description =
      generatedListing.description ||
      productData.description ||
      title;

    const imageUrls = Array.isArray(productData.images)
      ? productData.images.filter(
          (image: unknown): image is string =>
            typeof image === 'string' && image.length > 0,
        )
      : [];

    const itemSpecifics =
      listingData.itemSpecifics &&
      typeof listingData.itemSpecifics === 'object'
        ? listingData.itemSpecifics
        : {};

    // 5. Create or replace the eBay inventory item.
    await this.inventoryService.createInventoryItem({
      storeId: job.storeId,
      categoryId,
      sku,
      title,
      description,
      quantity: 1,
      condition: 'NEW',
      imageUrls,
      brand:
        typeof productData.brand === 'string'
          ? productData.brand
          : undefined,
      mpn:
        typeof productData.mpn === 'string'
          ? productData.mpn
          : undefined,
      aspects: itemSpecifics,
    });

    await this.prisma.importQueue.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'PROCESSING',
        progress: 70,
      },
    });

    // 6. Create the eBay offer.
    const offerResult =
      (await this.offerService.createOffer({
        storeId: job.storeId,
        sku,
        marketplaceId: 'EBAY_US',
        format: 'FIXED_PRICE',
        availableQuantity: 1,
        categoryId,
        merchantLocationKey: 'main',
        price: offerPrice,
        currency: 'USD',
        fulfillmentPolicyId,
        paymentPolicyId,
        returnPolicyId,
      })) as Record<string, any>;

    const offerId =
      typeof offerResult.offerId === 'string'
        ? offerResult.offerId
        : '';

    if (!offerId) {
      throw new Error('eBay did not return an offer ID.');
    }

    await this.prisma.importQueue.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'PROCESSING',
        progress: 85,
      },
    });

    // 7. Publish the offer to eBay.
    await this.offerService.publishOffer({
      storeId: job.storeId,
      offerId,
      title,
    });
// Save the completed import in permanent history.
await this.prisma.importHistory.create({
  data: {
    storeId: job.storeId,
    supplierUrl: job.supplierUrl,
    title,
    marketplace: 'EBAY',
    status: 'COMPLETED',
    error: null,
  },
});

// Save the published item in the master listings table.
const productImageUrl =
  typeof productData.imageUrl === "string"
    ? productData.imageUrl
    : Array.isArray(productData.images) &&
      typeof productData.images[0] === "string"
    ? productData.images[0]
    : Array.isArray(productData.imageUrls) &&
      typeof productData.imageUrls[0] === "string"
    ? productData.imageUrls[0]
    : null;

await this.prisma.listing.create({
  data: {
    storeId: job.storeId,
    title,
    sku,
    price: offerPrice,
    quantity: 1,
    marketplace: 'EBAY',
    status: 'ACTIVE',
    imageUrl: productImageUrl,
    externalId: offerId || null,
    externalUrl: null,
  },
});

// 8. Mark the queue item complete.
    return this.prisma.importQueue.update({
      where: {
        id: job.id,
      },
      data: {
        status: 'COMPLETED',
        progress: 100,
        title,
        error: null,
      },
    });
      } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown import error';

      console.error('Import queue processing failed:', error);

      throw new Error(message);
    }
  }
  async clearCompleted() {
  return this.prisma.importQueue.deleteMany({
    where: {
      status: 'COMPLETED',
    },
  });
}

async deleteQueueItem(id: string) {
  return this.prisma.importQueue.delete({
    where: {
      id,
    },
  });
}
async getAll() {
  return this.prisma.importQueue.findMany();
}
  }