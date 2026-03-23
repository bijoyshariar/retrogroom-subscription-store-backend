import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import Product from "./productModel";
import slugify from "slugify";
import { ProductDocument, ProductStockDocument } from "./productTypes";
import Collection from "../collection/collectionModel";
import { processProductImage, deleteProductImages } from "../../src/services/imageService";

const updateProductColorsAndSizes = (productStock: any) => {
  const color = new Set<string>();
  const size = new Set<string>();

  productStock.forEach((variant: any) => {
    color.add(variant.color);
    size.add(variant.size);
  });

  const colors = Array.from(color);
  const sizes = Array.from(size);
  return {
    colors,
    sizes,
  };
};

//Create Product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    productName,
    productPrice,
    productSalePrice,
    productDescription,
    shortDescription,
    longDescription,
    productCategory,
    productStock,
    productColor,
    productCollection,
    productImageUrl,
    productImage,
    productTags,
    productVariants,
    isFeatured,
    isTrending,
    trustNotes,
    deliveryNotes,
    lowStockLabel,
    status,
  } = req.body;
  if (
    !productName ||
    !productPrice ||
    !productDescription ||
    !productCategory
  ) {
    return next(createHttpError(400, "Input required fields"));
  }
  const proSlug = slugify(productName);
  const proCollection = productCollection ? slugify(productCollection) : "";
  const proCategory = slugify(productCategory);
  const product = await Product.findOne({ productSlug: proSlug });
  if (product) {
    return next(
      createHttpError(400, `${product?.productName} Product already exists`),
    );
  }

  const productVariant = productStock ? updateProductColorsAndSizes(productStock) : { colors: [], sizes: [] };

  try {
    const newProduct = new Product({
      productName,
      productPrice,
      productSalePrice: productSalePrice || null,
      productDescription,
      shortDescription: shortDescription || "",
      longDescription: longDescription || "",
      productCategory: proCategory,
      productSlug: proSlug,
      productColors: productVariant.colors,
      productSizes: productVariant.sizes,
      productStock: productStock || [],
      productColor,
      productCollection: proCollection,
      productImageUrl,
      productImage,
      productTags: productTags || [],
      productVariants: productVariants || [],
      isFeatured: isFeatured || false,
      isTrending: isTrending || false,
      trustNotes: trustNotes || "Secure payment and satisfaction guaranteed",
      deliveryNotes: deliveryNotes || "Instant digital delivery after purchase",
      lowStockLabel: lowStockLabel || "",
      status: status || "ACTIVE",
    });

    if (proCollection) {
      const collection = await Collection.findOne({
        collectionName: proCollection,
      });
      if (collection) {
        await Collection.findOneAndUpdate(
          { collectionName: collection.collectionName },
          {
            $push: {
              collectionProduct: newProduct._id,
            },
          },
        );
      } else {
        const newCollection = new Collection({
          collectionName: proCollection,
          collectionProduct: newProduct._id,
          collectionImage: null,
          collectionCategory: newProduct.productCategory,
        });

        await newCollection.save();
      }
    }

    await newProduct.save();
    res
      .status(201)
      .json({ Product: newProduct, message: "Product created successfully." });
  } catch (err: any) {
    return next(createHttpError(400, err.message));
  }
};

//Get All Product
export const getAllProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await Product.find();
    res.status(200).json(product);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//Get Product By Slug
export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const slug = req.params.slug;
  try {
    const product = await Product.find({ productSlug: slug });
    if (!product || product.length === 0) {
      return next(createHttpError(404, "Product not found"));
    }
    res.status(200).json(product);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//Get Product By Tag
export const getProductByTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tag = req.params.tag;
  try {
    const product = await Product.find({ productTags: tag });
    if (!product || product.length === 0) {
      return next(createHttpError(404, "Product not found"));
    }
    res.status(200).json(product);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//Get Product By Category
export const getProductByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const category = req.params.category;
  try {
    const product = await Product.find({ productCategory: category });
    if (!product || product.length === 0) {
      return next(createHttpError(404, "Product not found"));
    }
    res.status(200).json(product);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//Update Product Data
export const productDataUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id;
  const updateData = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    if (updateData.productName) {
      product.productName = updateData.productName;
      product.productSlug = slugify(updateData.productName);
    }
    if (updateData.productPrice !== undefined) product.productPrice = updateData.productPrice;
    if (updateData.productSalePrice !== undefined) product.productSalePrice = updateData.productSalePrice;
    if (updateData.productDescription !== undefined) product.productDescription = updateData.productDescription;
    if (updateData.shortDescription !== undefined) product.shortDescription = updateData.shortDescription;
    if (updateData.longDescription !== undefined) product.longDescription = updateData.longDescription;
    if (updateData.productTags !== undefined) product.productTags = updateData.productTags;
    if (updateData.productVariants !== undefined) product.productVariants = updateData.productVariants;
    if (updateData.isFeatured !== undefined) product.isFeatured = updateData.isFeatured;
    if (updateData.isTrending !== undefined) product.isTrending = updateData.isTrending;
    if (updateData.trustNotes !== undefined) product.trustNotes = updateData.trustNotes;
    if (updateData.deliveryNotes !== undefined) product.deliveryNotes = updateData.deliveryNotes;
    if (updateData.lowStockLabel !== undefined) product.lowStockLabel = updateData.lowStockLabel;
    if (updateData.status !== undefined) product.status = updateData.status;
    if (updateData.productImageUrl !== undefined) product.productImageUrl = updateData.productImageUrl;
    if (updateData.productImage !== undefined) product.productImage = updateData.productImage;
    if (updateData.productCategory !== undefined) product.productCategory = slugify(updateData.productCategory);

    await product.save();
    res
      .status(200)
      .json({ Product: product, message: "Product updated successfully." });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//Update Product Stock
export const productStockUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const {
    productStock,
  }: { productStock: { color: string; size: string; quantity: number }[] } =
    req.body;

  if (
    !productStock ||
    !Array.isArray(productStock) ||
    productStock.length === 0
  ) {
    return next(createHttpError(400, "productStock must be a non-empty array"));
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    productStock.forEach((stockItem) => {
      const { color, size, quantity } = stockItem;
      let updated = false;

      // Update existing stock entry or add a new one
      product.productStock.forEach((variant: ProductStockDocument) => {
        if (variant.color === color && variant.size === size) {
          variant.quantity = quantity;
          updated = true;
        }
      });

      if (!updated) {
        // Add new stock entry if it doesn't exist
        const newStockEntry: ProductStockDocument = {
          color,
          size,
          quantity,
        } as ProductStockDocument;
        product.productStock.push(newStockEntry);
      }
    });

    // Update productColors and productSizes fields
    const { colors, sizes } = updateProductColorsAndSizes(product.productStock);
    product.productColors = colors;
    product.productSizes = sizes;

    await product.save();
    res
      .status(200)
      .json({
        Product: product,
        message: "Product stock updated successfully.",
      });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//Delete Product
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }
    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully." });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//get product by collectionName
export const getProductByCollection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const collectionName = req.params.collectionName;
    const collection = await Collection.findOne({ collectionName });

    if (!collection) {
      return next(createHttpError(404, "Collection not found"));
    }

    const collectionProductIds = collection.collectionProduct;
    const products = await Promise.all(
      collectionProductIds.map((itemId) => Product.findById(itemId)),
    );

    return res.status(200).json(products);
  } catch (error: any) {
    return next(createHttpError(500, error.message));
  }
};

// Upload Product Cover Image (single)
export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  if (!req.file) {
    return next(createHttpError(400, "No image file provided"));
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    // Delete old image if exists
    if (product.productImage) {
      deleteProductImages(product.productImage);
    }

    const processed = await processProductImage(req.file);
    product.productImage = processed.original;

    await product.save();

    res.status(200).json({
      images: processed,
      message: "Product image uploaded successfully",
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Upload Product Gallery Images (multiple)
export const uploadProductGallery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return next(createHttpError(400, "No image files provided"));
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    const allProcessed = [];
    for (const file of files) {
      const processed = await processProductImage(file);
      product.productImageUrl.push(processed.original);
      allProcessed.push(processed);
    }

    await product.save();

    res.status(200).json({
      images: allProcessed,
      gallery: product.productImageUrl,
      message: `${files.length} image(s) uploaded successfully`,
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Delete Product Image from Gallery
export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return next(createHttpError(400, "imageUrl is required"));
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    // Remove from gallery array
    product.productImageUrl = product.productImageUrl.filter(
      (url) => url !== imageUrl,
    );

    // If it's the cover image, clear it
    if (product.productImage === imageUrl) {
      product.productImage = "";
    }

    deleteProductImages(imageUrl);
    await product.save();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};
