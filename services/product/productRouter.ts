import { Router } from "express";
import { isAdmin } from "../../src/middlewares/isAdmin";
import authMiddleware from "../../src/middlewares/authMiddleware";
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  getProductByCategory,
  getProductByCollection,
  getProductBySlug,
  getProductByTag,
  productDataUpdate,
  productStockUpdate,
  uploadProductImage,
  uploadProductGallery,
  deleteProductImage,
} from "./productController";
import { uploadSingle, uploadMultiple } from "../../src/middlewares/upload";

const productRouter = Router();

productRouter.get("/", getAllProduct);
productRouter.get("/collection/:collectionName", getProductByCollection);
productRouter.get("/:slug", getProductBySlug);
productRouter.get("/tag/:tag", getProductByTag);
productRouter.get("/category/:category", getProductByCategory);
productRouter.post("/createProduct", authMiddleware, isAdmin, createProduct);
productRouter.put("/:id", authMiddleware, isAdmin, productDataUpdate);
productRouter.put("/stock-update/:id", authMiddleware, isAdmin, productStockUpdate);
productRouter.delete("/:id", authMiddleware, isAdmin, deleteProduct);

// Image upload routes
productRouter.post("/:id/upload-image", authMiddleware, isAdmin, uploadSingle, uploadProductImage);
productRouter.post("/:id/upload-gallery", authMiddleware, isAdmin, uploadMultiple, uploadProductGallery);
productRouter.delete("/:id/delete-image", authMiddleware, isAdmin, deleteProductImage);

export default productRouter;
