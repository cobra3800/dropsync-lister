import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateStoreDto } from './dto/create-store.dto.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateStoreDto) {
    return this.storesService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.storesService.findAll(req.user.id);
  }
}