import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

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
}