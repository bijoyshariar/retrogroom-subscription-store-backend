import sharp from "sharp";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const SIZES = {
  thumbnail: { width: 300, height: 300 },
  card: { width: 600, height: 600 },
  hero: { width: 1200, height: 1200 },
};

// Ensure upload directories exist
const ensureDirs = () => {
  const dirs = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, "products"),
    path.join(UPLOAD_DIR, "products/thumbnail"),
    path.join(UPLOAD_DIR, "products/card"),
    path.join(UPLOAD_DIR, "products/hero"),
    path.join(UPLOAD_DIR, "collections"),
    path.join(UPLOAD_DIR, "banners"),
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};

ensureDirs();

interface ProcessedImage {
  original: string;
  thumbnail: string;
  card: string;
  hero: string;
}

// Process product image: validate, compress, generate sizes
export const processProductImage = async (
  file: Express.Multer.File,
): Promise<ProcessedImage> => {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const metadata = await sharp(file.buffer).metadata();

  // Validate max raw size 2MB
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image exceeds 2MB upload limit");
  }

  // Generate all sizes as WebP
  const results: Record<string, string> = {};

  for (const [sizeName, dimensions] of Object.entries(SIZES)) {
    const outputFilename = `${filename}-${sizeName}.webp`;
    const outputPath = path.join(UPLOAD_DIR, "products", sizeName, outputFilename);

    await sharp(file.buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    results[sizeName] = `/uploads/products/${sizeName}/${outputFilename}`;
  }

  // Save original as WebP (max 1200px, compressed)
  const originalFilename = `${filename}-original.webp`;
  const originalPath = path.join(UPLOAD_DIR, "products", originalFilename);

  await sharp(file.buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(originalPath);

  results.original = `/uploads/products/${originalFilename}`;

  return results as unknown as ProcessedImage;
};

// Process collection/banner image
export const processCollectionImage = async (
  file: Express.Multer.File,
  type: "collection" | "banner",
): Promise<string> => {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image exceeds 2MB upload limit");
  }

  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
  const folder = type === "collection" ? "collections" : "banners";
  const outputPath = path.join(UPLOAD_DIR, folder, filename);

  const dimensions =
    type === "collection"
      ? { width: 1600, height: 600 }
      : { width: 1920, height: 800 };

  await sharp(file.buffer)
    .resize(dimensions.width, dimensions.height, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 80 })
    .toFile(outputPath);

  return `/uploads/${folder}/${filename}`;
};

// Delete an image and its variants
export const deleteProductImages = (originalUrl: string) => {
  if (!originalUrl) return;

  const basename = path.basename(originalUrl).replace("-original.webp", "");
  const dirs = ["products", "products/thumbnail", "products/card", "products/hero"];

  dirs.forEach((dir) => {
    const dirPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(dirPath)) return;
    fs.readdirSync(dirPath).forEach((file) => {
      if (file.startsWith(basename)) {
        fs.unlinkSync(path.join(dirPath, file));
      }
    });
  });
};
