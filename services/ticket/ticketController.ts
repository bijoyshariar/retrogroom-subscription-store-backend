import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import Ticket from "./ticketModel";
import Order from "../order/orderModel";

interface AuthRequest extends Request {
  user?: any;
}

// Customer: Create Ticket
export const createTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { orderId, subject, message } = req.body;
  const userId = req.user._id;

  if (!orderId || !subject || !message) {
    return next(createHttpError(400, "Order ID, subject, and message are required"));
  }

  try {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return next(createHttpError(404, "Order not found or does not belong to you"));
    }

    const ticket = new Ticket({
      user: userId,
      order: orderId,
      subject,
      messages: [{ sender: "CUSTOMER", message }],
    });

    await ticket.save();
    res.status(201).json({ ticket, message: "Ticket created successfully" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Customer: Get My Tickets
export const getMyTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;

  try {
    const tickets = await Ticket.find({ user: userId })
      .populate("order", "orderNumber status")
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Customer: Get Single Ticket
export const getTicketById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const ticket = await Ticket.findOne({ _id: id, user: userId })
      .populate("order", "orderNumber status credentials")
      .populate("user", "userName email");
    if (!ticket) {
      return next(createHttpError(404, "Ticket not found"));
    }
    res.status(200).json(ticket);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Customer: Reply to Ticket
export const customerReplyTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user._id;

  if (!message) {
    return next(createHttpError(400, "Message is required"));
  }

  try {
    const ticket = await Ticket.findOne({ _id: id, user: userId });
    if (!ticket) {
      return next(createHttpError(404, "Ticket not found"));
    }
    if (ticket.status === "CLOSED") {
      return next(createHttpError(400, "Cannot reply to a closed ticket"));
    }

    ticket.messages.push({ sender: "CUSTOMER", message, createdAt: new Date() });
    ticket.status = "OPEN";
    await ticket.save();

    res.status(200).json({ ticket, message: "Reply sent successfully" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Get All Tickets
export const getAllTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter)
      .populate("user", "userName email whatsappNumber")
      .populate("order", "orderNumber status")
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Reply to Ticket
export const adminReplyTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return next(createHttpError(400, "Message is required"));
  }

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return next(createHttpError(404, "Ticket not found"));
    }

    ticket.messages.push({ sender: "ADMIN", message, createdAt: new Date() });
    ticket.status = "IN_PROGRESS";
    await ticket.save();

    res.status(200).json({ ticket, message: "Admin reply sent successfully" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Update Ticket Status
export const updateTicketStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(createHttpError(400, "Status is required"));
  }

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!ticket) {
      return next(createHttpError(404, "Ticket not found"));
    }
    res.status(200).json({ ticket, message: "Ticket status updated" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};
