import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
      },
    });

    await this.prisma.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    return organization;
  }

  async findAll() {
    return this.prisma.organization.findMany();
  }
}