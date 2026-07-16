import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';

@Injectable()
export class EbayAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStore(storeId: string) {
    return this.prisma.ebayAccount.findUnique({
      where: { storeId },
    });
  }

  async save(data: {
    storeId: string;
    ebayUserId?: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    environment: string;
    scope?: string;
  }) {
    return this.prisma.ebayAccount.upsert({
      where: { storeId: data.storeId },
      update: data,
      create: data,
    });
  }

  async disconnect(storeId: string) {
    return this.prisma.ebayAccount.delete({
      where: { storeId },
    });
  }
}