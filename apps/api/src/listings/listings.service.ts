import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service.js';
import { EbayService } from '../ebay/ebay.service.js';
@Injectable()
export class ListingsService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly ebayService: EbayService,
) {}

  async getAll() {
    return this.prisma.listing.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: Prisma.ListingUpdateInput,
  ) {
    return this.prisma.listing.update({
      where: { id },
      data,
    });
  }

  async syncStatusesFromEbay(storeId: string) {
    console.log('SYNC STATUSES STARTED:', storeId);
const listings = await this.prisma.listing.findMany({
  where: {
    marketplace: 'EBAY',
    externalId: {
      not: null,
    },
  },
});
console.log('EBAY LISTINGS FOUND:', listings.length);
for (const listing of listings) {
  console.log('CHECKING EBAY LISTING:', listing.externalId);
const status = await this.ebayService.getListingStatus(
  storeId,
  listing.externalId!,
);
console.log('EBAY STATUS RESULT:', listing.externalId, status);
await this.prisma.listing.update({
  where: { id: listing.id },
  data: {
    status: status.status,
  },
});
}
}
}