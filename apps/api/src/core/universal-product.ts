export interface UniversalProduct {
  id: string;

  source: string;

  title: string;

  description: string;

  images: string[];

  brand?: string;

  category?: string;

  specifications: Record<string, string>;

  price: number;

  quantity: number;

  condition: string;

  sku?: string;

  upc?: string;

  shippingWeight?: string;
}