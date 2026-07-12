import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post()
  create(
    @Request() req: any,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(req.user.id, dto);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }
}