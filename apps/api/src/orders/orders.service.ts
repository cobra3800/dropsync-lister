import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EbayService } from '../ebay/ebay.service.js';
@Injectable()
export class OrdersService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly ebayService: EbayService,
) {}
  async findAll() {
  return this.prisma.order.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
async syncFromEbay(storeId: string) {
  const ebayResponse = await this.ebayService.getOrders(storeId);
  const orders = ebayResponse.orders ?? [];

  for (const order of orders) {
    const lineItem = order.lineItems?.[0];
    const shipping = order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo;

    await this.prisma.order.upsert({
      where: {
        externalOrderId: order.orderId,
      },
      update: {
        buyerUsername: order.buyer?.username ?? null,
        buyerName: shipping?.fullName ?? null,
        buyerEmail: order.buyer?.buyerRegistrationAddress?.email ?? null,
        status: order.orderFulfillmentStatus ?? 'PENDING',
        total: Number(order.pricingSummary?.total?.value ?? 0),
        currency: order.pricingSummary?.total?.currency ?? 'USD',
        itemId: lineItem?.legacyItemId ?? null,
        sku: lineItem?.sku ?? null,
        title: lineItem?.title ?? null,
        quantity: lineItem?.quantity ?? 1,
        shippingName: shipping?.fullName ?? null,
        shippingAddress: shipping
          ? [
              shipping.contactAddress?.addressLine1,
              shipping.contactAddress?.addressLine2,
              shipping.contactAddress?.city,
              shipping.contactAddress?.stateOrProvince,
              shipping.contactAddress?.postalCode,
              shipping.contactAddress?.countryCode,
            ]
              .filter(Boolean)
              .join(', ')
          : null,
      },
      create: {
        storeId,
        marketplace: 'EBAY',
        externalOrderId: order.orderId,
        buyerUsername: order.buyer?.username ?? null,
        buyerName: shipping?.fullName ?? null,
        buyerEmail: order.buyer?.buyerRegistrationAddress?.email ?? null,
        status: order.orderFulfillmentStatus ?? 'PENDING',
        total: Number(order.pricingSummary?.total?.value ?? 0),
        currency: order.pricingSummary?.total?.currency ?? 'USD',
        itemId: lineItem?.legacyItemId ?? null,
        sku: lineItem?.sku ?? null,
        title: lineItem?.title ?? null,
        quantity: lineItem?.quantity ?? 1,
        shippingName: shipping?.fullName ?? null,
        shippingAddress: shipping
          ? [
              shipping.contactAddress?.addressLine1,
              shipping.contactAddress?.addressLine2,
              shipping.contactAddress?.city,
              shipping.contactAddress?.stateOrProvince,
              shipping.contactAddress?.postalCode,
              shipping.contactAddress?.countryCode,
            ]
              .filter(Boolean)
              .join(', ')
          : null,
      },
    });
  }

  return {
    synced: orders.length,
    orders,
  };
}

}