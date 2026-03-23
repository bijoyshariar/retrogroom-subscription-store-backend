import { model, Schema } from "mongoose";
import { ProductDocument } from "./productTypes";

const productStockSchema = new Schema({
  color: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
});

const productVariantSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  salePrice: {
    type: Number,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
});

const productSchema = new Schema<ProductDocument>(
  {
    productName: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    productSalePrice: {
      type: Number,
      default: null,
    },
    productDescription: {
      type: String,
    },
    shortDescription: {
      type: String,
    },
    longDescription: {
      type: String,
    },
    productImage: {
      type: String,
    },
    productImageUrl: {
      type: [String],
    },
    productCategory: {
      type: String,
      lowercase: true,
    },
    productSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    totalSoldProduct: {
      type: Number,
      default: 0,
    },
    productColors: [String],
    productSizes: [String],
    productStock: [productStockSchema],
    productCollection: {
      type: String,
      lowercase: true,
    },
    productTags: {
      type: [String],
      default: [],
    },
    productVariants: [productVariantSchema],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    trustNotes: {
      type: String,
      default: "Secure payment and satisfaction guaranteed",
    },
    deliveryNotes: {
      type: String,
      default: "Instant digital delivery after purchase",
    },
    lowStockLabel: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "HIDDEN"],
      default: "ACTIVE",
    },
    productRatings: [
      {
        rating: {
          type: Number,
        },
        comment: {
          type: String,
        },
        orderProductId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
        },
        postBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    productTotalRating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

productSchema.index({ productCategory: 1 });
productSchema.index({ productTags: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ status: 1 });
productSchema.index({ productCollection: 1 });

const Product = model<ProductDocument>("Product", productSchema);
export default Product;
