import mongoose, { Document } from "mongoose";

export interface TicketMessageDocument {
  sender: "CUSTOMER" | "ADMIN";
  message: string;
  createdAt: Date;
}

export interface TicketDocument extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  ticketNumber: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  messages: TicketMessageDocument[];
}
