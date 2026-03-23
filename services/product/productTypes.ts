import { Types, Document } from "mongoose";

export interface ProductStockDocument extends Document {
  color: string;
  size: string;
  quantity: number;
}

export interface ProductVariantDocument extends Document {
  name: string;
  price: number;
  salePrice: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductDocument extends Document {
  productId: string;
  productName: string;
  productPrice: number;
  productSalePrice: number | null;
  productDescription: string;
  shortDescription: string;
  longDescription: string;
  productImage: string;
  productImageUrl: string[];
  productCategory: string;
  productSlug: string;
  totalSoldProduct: number;
  productColors: string[];
  productSizes: string[];
  productStock: ProductStockDocument[];
  productCollection: string;
  productTags: string[];
  productVariants: ProductVariantDocument[];
  isFeatured: boolean;
  isTrending: boolean;
  trustNotes: string;
  deliveryNotes: string;
  lowStockLabel: string;
  status: "DRAFT" | "ACTIVE" | "HIDDEN";
  productRatings: {
    rating: number;
    comment: string;
    orderProductId: Types.ObjectId;
    postBy: Types.ObjectId;
  }[];
  productTotalRating: number;
}
