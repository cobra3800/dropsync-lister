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
      ebayAccount: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
}