import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

type CreatePublishHistoryInput = {
  storeId: string;
  title: string;
  ebayItemId?: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
};

@Injectable()
export class PublishHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePublishHistoryInput) {
    return this.prisma.publishHistory.create({
      data: {
        storeId: input.storeId,
        title: input.title,
        ebayItemId: input.ebayItemId,
        status: input.status,
        error: input.error,
      },
    });
  }

  findAllByStore(storeId: string) {
    return this.prisma.publishHistory.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
  }
}