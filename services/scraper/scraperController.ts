import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import slugify from "slugify";
import Product from "../product/productModel";
import { scrapeAll, scrapeNetflixMart, scrapeFanflix, scrapeSubsBhai } from "./scraperService";
import { ScrapedProduct, BulkUploadResult } from "./scraperTypes";

interface AuthRequest extends Request {
  user?: any;
}

// Admin: Scrape products from all sites (preview, no save)
export const scrapePreview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { site } = req.query; // optional: "netflixmart", "fanflix", "subsbhai", or empty for all

  try {
    let products: ScrapedProduct[];

    if (site === "netflixmart") {
      products = await scrapeNetflixMart();
    } else if (site === "fanflix") {
      products = await scrapeFanflix();
    } else if (site === "subsbhai") {
      products = await scrapeSubsBhai();
    } else {
      products = await scrapeAll();
    }

    res.status(200).json({
      total: products.length,
      products,
      message: `Scraped ${products.length} products. Use /bulk-upload to import them.`,
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Helper: save scraped products to DB
const saveScrapedProducts = async (products: ScrapedProduct[]): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = {
    total: products.length,
    created: 0,
    skipped: 0,
    errors: [],
  };

  for (const p of products) {
    try {
      const slug = slugify(p.productName, { lower: true, strict: true });

      // Skip if product with same slug already exists
      const existing = await Product.findOne({ productSlug: slug });
      if (existing) {
        result.skipped++;
        continue;
      }

      const newProduct = new Product({
        productName: p.productName,
        productPrice: p.productPrice,
        productSalePrice: p.productSalePrice,
        productDescription: p.productDescription,
        shortDescription: p.shortDescription,
        productImage: p.productImage,
        productImageUrl: p.productImageUrl,
        productCategory: slugify(p.productCategory, { lower: true, strict: true }),
        productSlug: slug,
        productTags: p.productTags.map(t => t.toLowerCase()),
        productVariants: p.productVariants,
        status: "DRAFT", // Import as draft, admin reviews before publishing
      });

      await newProduct.save();
      result.created++;
    } catch (err: any) {
      result.errors.push(`${p.productName}: ${err.message}`);
    }
  }

  return result;
};

// Admin: Scrape and import from all sites
export const scrapeAndImport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { site } = req.query;

  try {
    let products: ScrapedProduct[];

    if (site === "netflixmart") {
      products = await scrapeNetflixMart();
    } else if (site === "fanflix") {
      products = await scrapeFanflix();
    } else if (site === "subsbhai") {
      products = await scrapeSubsBhai();
    } else {
      products = await scrapeAll();
    }

    const result = await saveScrapedProducts(products);

    res.status(200).json({
      ...result,
      message: `Imported ${result.created} products, skipped ${result.skipped} duplicates, ${result.errors.length} errors`,
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Bulk upload from JSON body (manual / frontend form)
export const bulkUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return next(createHttpError(400, "products array is required"));
  }

  try {
    const result = await saveScrapedProducts(products);

    res.status(200).json({
      ...result,
      message: `Uploaded ${result.created} products, skipped ${result.skipped} duplicates, ${result.errors.length} errors`,
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Bulk update status (publish drafted imports)
export const bulkUpdateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { productIds, status } = req.body;

  if (!productIds || !Array.isArray(productIds) || !status) {
    return next(createHttpError(400, "productIds array and status are required"));
  }

  try {
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { status },
    );

    res.status(200).json({
      modified: result.modifiedCount,
      message: `${result.modifiedCount} products updated to ${status}`,
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};
