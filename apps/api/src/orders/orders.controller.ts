import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
getOrders() {
  return this.ordersService.findAll();
}
  @Get('check-database')
  checkDatabase() {
    return this.ordersService.checkDatabase();
  }
@Get(':id')
getOrderById(@Param('id') id: string) {
  return this.ordersService.findOne(id);
}
  @Post('sync/ebay')
  syncEbay(@Body('storeId') storeId: string) {
    return this.ordersService.syncFromEbay(storeId);
  }
}