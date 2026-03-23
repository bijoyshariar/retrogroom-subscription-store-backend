import { Router } from "express";
import authMiddleware from "../../src/middlewares/authMiddleware";
import { isAdmin } from "../../src/middlewares/isAdmin";
import {
  createTicket,
  getMyTickets,
  getTicketById,
  customerReplyTicket,
  getAllTickets,
  adminReplyTicket,
  updateTicketStatus,
} from "./ticketController";

const ticketRouter = Router();

// Customer routes
ticketRouter.post("/create", authMiddleware, createTicket);
ticketRouter.get("/my-tickets", authMiddleware, getMyTickets);
ticketRouter.get("/:id", authMiddleware, getTicketById);
ticketRouter.post("/:id/reply", authMiddleware, customerReplyTicket);

// Admin routes
ticketRouter.get("/admin/all", authMiddleware, isAdmin, getAllTickets);
ticketRouter.post("/admin/:id/reply", authMiddleware, isAdmin, adminReplyTicket);
ticketRouter.put("/admin/:id/status", authMiddleware, isAdmin, updateTicketStatus);

export default ticketRouter;
