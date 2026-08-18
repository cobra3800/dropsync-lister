import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateStoreDto } from './dto/create-store.dto.js';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateStoreDto) {
 // Development mode:
// Skip organization permission check for now.

    return this.prisma.store.create({
      data: {
        name: dto.name,
        marketplace: dto.marketplace,
        organizationId: dto.organizationId,
        status: 'CONNECTED',
      },
    });
  }

async findAll(userId: string) {
  return this.prisma.store.findMany({
    include: {
      organization: true,
      ebayAccount: {
        select: {
          id: true,
          storeId: true,
          ebayUserId: true,
          environment: true,
          expiresAt: true,
          scope: true,
          connectedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

async remove(userId: string, id: string) {
  const store = await this.prisma.store.findFirst({
    where: {
      id,
      organization: {
        memberships: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      ebayAccount: true,
    },
  });

  if (!store) {
    throw new Error('Store not found');
  }

  if (store.ebayAccount) {
    throw new Error(
      'Active eBay-connected stores cannot be deleted',
    );
  }

  return this.prisma.store.delete({
    where: {
      id: store.id,
    },
  });
}
}