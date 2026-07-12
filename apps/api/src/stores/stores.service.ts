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
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: dto.organizationId,
        },
      },
    });

    if (
      !membership ||
      !['OWNER', 'ADMIN'].includes(membership.role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to create a store for this organization.',
      );
    }

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
      where: {
        organization: {
          memberships: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        organization: true,
      },
    });
  }
}