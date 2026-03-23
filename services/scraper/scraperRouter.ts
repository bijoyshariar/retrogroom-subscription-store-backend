import { Router } from "express";
import authMiddleware from "../../src/middlewares/authMiddleware";
import { isAdmin } from "../../src/middlewares/isAdmin";
import {
  scrapePreview,
  scrapeAndImport,
  bulkUpload,
  bulkUpdateStatus,
} from "./scraperController";

const scraperRouter = Router();

// All routes require admin
scraperRouter.get("/preview", authMiddleware, isAdmin, scrapePreview);
scraperRouter.post("/import", authMiddleware, isAdmin, scrapeAndImport);
scraperRouter.post("/bulk-upload", authMiddleware, isAdmin, bulkUpload);
scraperRouter.put("/bulk-status", authMiddleware, isAdmin, bulkUpdateStatus);

export default scraperRouter;
