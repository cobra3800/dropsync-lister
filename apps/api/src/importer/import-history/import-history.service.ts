import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';

@Injectable()
export class ImportHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.importHistory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async clearCompleted() {
    return this.prisma.importHistory.deleteMany({
      where: {
        status: 'COMPLETED',
      },
    });
  }

  async deleteOne(id: string) {
    return this.prisma.importHistory.delete({
      where: {
        id,
      },
    });
  }
}