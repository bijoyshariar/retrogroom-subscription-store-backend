export interface ScrapedProduct {
  productName: string;
  productPrice: number;
  productSalePrice: number | null;
  productDescription: string;
  shortDescription: string;
  productCategory: string;
  productImage: string;
  productImageUrl: string[];
  productTags: string[];
  productVariants: {
    name: string;
    price: number;
    salePrice: number | null;
  }[];
  sourceUrl: string;
  sourceSite: string;
}

export interface BulkUploadResult {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}
