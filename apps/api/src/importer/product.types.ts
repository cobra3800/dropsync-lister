export type ProductSource =
  | 'amazon'
  | 'walmart'
  | 'aliexpress'
  | 'ebay'
  | 'unknown';

export interface SupplierProduct {
  title: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  images: string[];
  category: string;
  specifications: Record<string, string>;
  availability?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
}

export interface ImportedProduct extends SupplierProduct {
  source: ProductSource;
  sourceUrl: string;
}