
import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
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
  
@Patch(':id/shipping')
updateShipping(
  @Param('id') id: string,
  @Body()
  data: {
    shippingCarrier?: string;
    trackingNumber?: string;
    fulfillmentStatus?: string;
  },
) {
  return this.ordersService.updateShipping(id, data);
}

}