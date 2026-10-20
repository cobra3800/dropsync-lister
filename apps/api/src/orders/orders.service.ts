import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EbayService } from '../ebay/ebay.service.js';
@Injectable()
export class OrdersService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly ebayService: EbayService,
) {}

  
  async checkDatabase() {
    const result = await this.prisma.$queryRawUnsafe<
      { seq: bigint; name: string; file: string }[]
    >('PRAGMA database_list');

    return result.map((db) => ({
      name: db.name,
      file: db.file,
    }));
  }


  async findAll() {
  return this.prisma.order.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
async findOne(id: string) {
  return this.prisma.order.findUnique({
    where: { id },
  });
}
async syncFromEbay(storeId: string) {
  const ebayResponse = await this.ebayService.getOrders(storeId);
  const orders = ebayResponse.orders ?? [];

  for (const order of orders) {
    console.log('ORDER STATUS CHECK:', {
  orderId: order.orderId,
  fulfillmentStatus: order.orderFulfillmentStatus,
  cancelStatus: order.cancelStatus,
  paymentStatus: order.orderPaymentStatus,
});
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
        status:
  order.cancelStatus?.cancelState === 'CANCELED'
    ? 'CANCELED'
    : order.orderFulfillmentStatus ?? 'PENDING',
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
        status:
  order.cancelStatus?.cancelState === 'CANCELED'
    ? 'CANCELED'
    : order.orderFulfillmentStatus ?? 'PENDING',
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

async updateShipping(
  id: string,
  data: {
    shippingCarrier?: string;
    trackingNumber?: string;
    fulfillmentStatus?: string;
  },
) {
  const order = await this.prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'CANCELED') {
    throw new BadRequestException(
  'Cannot update shipping on a canceled order',
);
  }
const isTestOrder =
  order.externalOrderId?.startsWith('DROPSYNC-') ?? false;

const isTestTracking =
  data.trackingNumber
    ?.trim()
    .toUpperCase()
    .startsWith('DROPSYNC-TEST-') ?? false;

if (!isTestOrder && isTestTracking) {
  throw new BadRequestException(
    'Test tracking numbers cannot be used on real orders.',
  );
}
  return this.prisma.order.update({
    where: { id },
    data: {
      shippingCarrier: data.shippingCarrier,
      trackingNumber: data.trackingNumber,
      fulfillmentStatus: data.fulfillmentStatus,
      shippedAt:
        data.fulfillmentStatus === 'SHIPPED'
          ? new Date()
          : undefined,
    },
  });
}

}